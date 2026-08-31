import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceToken: process.env.NOTIFICATION_SERVICE_TOKEN || 'grace_internal_notif_sec_key_2026',
  
  sms: {
    provider: process.env.SMS_PROVIDER || '2factor',
    apiKey: process.env.TWO_FACTOR_API_KEY || '',
    senderId: process.env.TWO_FACTOR_SENDER_ID || 'SWIFTR',
    templateName: process.env.TWO_FACTOR_TEMPLATE_NAME || 'SwiftRideOTP',
    baseUrl: process.env.TWO_FACTOR_BASE_URL || 'https://2factor.in/API',
  },

  whatsapp: {
    provider: process.env.WHATSAPP_PROVIDER || 'meta',
    token: process.env.META_WHATSAPP_TOKEN || '',
    phoneId: process.env.META_WHATSAPP_PHONE_ID || '',
    graphApiVersion: process.env.META_GRAPH_API_VERSION || 'v21.0',
  }
};
