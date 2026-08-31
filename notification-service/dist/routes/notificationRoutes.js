"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Public Health Check
router.get('/health', notificationController_1.NotificationController.healthCheck);
// Protected Notification Routes (Service-to-Service auth required)
router.post('/notifications/sms', authMiddleware_1.serviceAuthMiddleware, notificationController_1.NotificationController.sendSms);
router.post('/notifications/sms/template', authMiddleware_1.serviceAuthMiddleware, notificationController_1.NotificationController.sendSmsTemplate);
router.post('/notifications/whatsapp', authMiddleware_1.serviceAuthMiddleware, notificationController_1.NotificationController.sendWhatsApp);
router.post('/notifications/whatsapp/template', authMiddleware_1.serviceAuthMiddleware, notificationController_1.NotificationController.sendWhatsAppTemplate);
exports.default = router;
