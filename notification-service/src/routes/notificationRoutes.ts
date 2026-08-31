import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { serviceAuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public Health Check
router.get('/health', NotificationController.healthCheck);

// Protected Notification Routes (Service-to-Service auth required)
router.post('/notifications/sms', serviceAuthMiddleware, NotificationController.sendSms);
router.post('/notifications/sms/template', serviceAuthMiddleware, NotificationController.sendSmsTemplate);
router.post('/notifications/whatsapp', serviceAuthMiddleware, NotificationController.sendWhatsApp);
router.post('/notifications/whatsapp/template', serviceAuthMiddleware, NotificationController.sendWhatsAppTemplate);

export default router;
