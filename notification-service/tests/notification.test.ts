import request from 'supertest';
import app from '../src/app';
import axios from 'axios';
import { config } from '../src/config/env';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Grace Cabs Notification Microservice Test Suite', () => {
  const validAuthHeader = `Bearer ${config.serviceToken}`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Health Check Endpoint', () => {
    it('GET /api/health should return 200 OK without authentication', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('grace-cabs-notification-service');
      expect(typeof res.body.uptime).toBe('number');
    });
  });

  describe('2. Service-to-Service Authentication', () => {
    it('should reject request without Authorization header', async () => {
      const res = await request(app)
        .post('/api/notifications/sms')
        .send({ to: '+919080280818', message: 'Test message' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.status).toBe('unauthorized');
    });

    it('should reject request with invalid service token', async () => {
      const res = await request(app)
        .post('/api/notifications/sms')
        .set('Authorization', 'Bearer invalid_random_token')
        .send({ to: '+919080280818', message: 'Test message' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.status).toBe('unauthorized');
    });
  });

  describe('3. Validation & Malformed Requests', () => {
    it('should reject SMS request with missing message', async () => {
      const res = await request(app)
        .post('/api/notifications/sms')
        .set('Authorization', validAuthHeader)
        .send({ to: '+919080280818' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject SMS template request with missing templateName', async () => {
      const res = await request(app)
        .post('/api/notifications/sms/template')
        .set('Authorization', validAuthHeader)
        .send({ to: '+919080280818' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject WhatsApp request with missing message', async () => {
      const res = await request(app)
        .post('/api/notifications/whatsapp')
        .set('Authorization', validAuthHeader)
        .send({ to: '+919080280818' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Missing Credentials Handling', () => {
    it('should return configuration_missing status when 2Factor API key is empty', async () => {
      const origKey = config.sms.apiKey;
      (config.sms as any).apiKey = '';

      const res = await request(app)
        .post('/api/notifications/sms')
        .set('Authorization', validAuthHeader)
        .send({ to: '+919080280818', message: 'Your booking is confirmed.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.status).toBe('configuration_missing');
      expect(res.body.provider).toBe('2factor');

      (config.sms as any).apiKey = origKey;
    });

    it('should return configuration_missing status when Meta WhatsApp credentials are empty', async () => {
      const origToken = config.whatsapp.token;
      (config.whatsapp as any).token = '';

      const res = await request(app)
        .post('/api/notifications/whatsapp')
        .set('Authorization', validAuthHeader)
        .send({ to: '+919080280818', message: 'Your booking is confirmed.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.status).toBe('configuration_missing');
      expect(res.body.provider).toBe('meta');

      (config.whatsapp as any).token = origToken;
    });
  });

  describe('5. SMS Provider Dispatching (2Factor)', () => {
    it('should successfully dispatch direct SMS when provider responds with success', async () => {
      (config.sms as any).apiKey = 'mock_2factor_key_123';

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          Status: 'Success',
          Details: 'session-id-sms-9988',
        },
      });

      const res = await request(app)
        .post('/api/notifications/sms')
        .set('Authorization', validAuthHeader)
        .send({ to: '+919080280818', message: 'Your driver is on the way.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('sent');
      expect(res.body.provider).toBe('2factor');
      expect(res.body.messageId).toBe('session-id-sms-9988');
    });

    it('should handle provider failure when 2Factor rejects request', async () => {
      (config.sms as any).apiKey = 'mock_2factor_key_123';

      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            Status: 'Error',
            Details: 'Insufficient SMS Balance',
          },
        },
      });

      const res = await request(app)
        .post('/api/notifications/sms')
        .set('Authorization', validAuthHeader)
        .send({ to: '+919080280818', message: 'Your driver is on the way.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.status).toBe('provider_failure');
      expect(res.body.message).toContain('Insufficient SMS Balance');
    });

    it('should successfully dispatch DLT template SMS', async () => {
      (config.sms as any).apiKey = 'mock_2factor_key_123';

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          Status: 'Success',
          Details: 'dlt-trans-msg-id-1234',
        },
      });

      const res = await request(app)
        .post('/api/notifications/sms/template')
        .set('Authorization', validAuthHeader)
        .send({
          to: '+919080280818',
          templateName: 'Driver Assigning',
          variables: ['Ramesh Driver', 'John Doe (GC-101)', '9876543210', 'Chennai Central to Airport'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('sent');
      expect(res.body.provider).toBe('2factor');
      expect(res.body.messageId).toBe('dlt-trans-msg-id-1234');
    });
  });

  describe('6. WhatsApp Provider Dispatching (Meta Graph API)', () => {
    it('should successfully dispatch text WhatsApp message when Meta responds with success', async () => {
      (config.whatsapp as any).token = 'mock_meta_token_abc';
      (config.whatsapp as any).phoneId = 'mock_phone_id_999';

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          messaging_product: 'whatsapp',
          contacts: [{ input: '+919080280818', wa_id: '919080280818' }],
          messages: [{ id: 'wamid.HBgLOTE5MDgwMjg...' }],
        },
      });

      const res = await request(app)
        .post('/api/notifications/whatsapp')
        .set('Authorization', validAuthHeader)
        .send({ to: '+919080280818', message: 'Your Grace Cabs trip has started.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('sent');
      expect(res.body.provider).toBe('meta');
      expect(res.body.messageId).toBe('wamid.HBgLOTE5MDgwMjg...');
    });

    it('should handle provider failure when Meta Graph API returns error', async () => {
      (config.whatsapp as any).token = 'mock_meta_token_abc';
      (config.whatsapp as any).phoneId = 'mock_phone_id_999';

      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            error: {
              message: 'Invalid OAuth access token',
              type: 'OAuthException',
              code: 190,
            },
          },
        },
      });

      const res = await request(app)
        .post('/api/notifications/whatsapp')
        .set('Authorization', validAuthHeader)
        .send({ to: '+919080280818', message: 'Your Grace Cabs trip has started.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.status).toBe('provider_failure');
      expect(res.body.message).toContain('Invalid OAuth access token');
    });
  });
});
