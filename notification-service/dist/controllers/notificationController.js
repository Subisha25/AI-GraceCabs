"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const smsService_1 = require("../services/smsService");
const whatsappService_1 = require("../services/whatsappService");
const smsService = new smsService_1.SmsService();
const whatsAppService = new whatsappService_1.WhatsAppService();
class NotificationController {
    static async healthCheck(req, res) {
        res.status(200).json({
            status: 'ok',
            service: 'grace-cabs-notification-service',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        });
    }
    static async sendSms(req, res) {
        const { to, message } = req.body;
        if (!to || !message) {
            res.status(400).json({
                success: false,
                status: 'invalid_request',
                message: 'Both "to" and "message" fields are required',
            });
            return;
        }
        const result = await smsService.sendSms(to, message);
        const statusCode = result.status === 'invalid_recipient' ? 400 : 200;
        res.status(statusCode).json(result);
    }
    static async sendSmsTemplate(req, res) {
        const { to, templateName, variables } = req.body;
        if (!to || !templateName) {
            res.status(400).json({
                success: false,
                status: 'invalid_request',
                message: 'Both "to" and "templateName" fields are required',
            });
            return;
        }
        const result = await smsService.sendTemplateSms(to, templateName, Array.isArray(variables) ? variables : []);
        const statusCode = result.status === 'invalid_recipient' ? 400 : 200;
        res.status(statusCode).json(result);
    }
    static async sendWhatsApp(req, res) {
        const { to, message } = req.body;
        if (!to || !message) {
            res.status(400).json({
                success: false,
                status: 'invalid_request',
                message: 'Both "to" and "message" fields are required',
            });
            return;
        }
        const result = await whatsAppService.sendWhatsApp(to, message);
        const statusCode = result.status === 'invalid_recipient' ? 400 : 200;
        res.status(statusCode).json(result);
    }
    static async sendWhatsAppTemplate(req, res) {
        const { to, templateName, languageCode, components } = req.body;
        if (!to || !templateName) {
            res.status(400).json({
                success: false,
                status: 'invalid_request',
                message: 'Both "to" and "templateName" fields are required',
            });
            return;
        }
        const result = await whatsAppService.sendTemplateWhatsApp(to, templateName, languageCode || 'en', Array.isArray(components) ? components : []);
        const statusCode = result.status === 'invalid_recipient' ? 400 : 200;
        res.status(statusCode).json(result);
    }
}
exports.NotificationController = NotificationController;
