import { Request, Response } from 'express';
import { SmsService } from '../services/smsService';
import { WhatsAppService } from '../services/whatsappService';

const smsService = new SmsService();
const whatsAppService = new WhatsAppService();

export class NotificationController {
  public static async healthCheck(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'ok',
      service: 'grace-cabs-notification-service',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }

  public static async sendSms(req: Request, res: Response): Promise<void> {
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

  public static async sendSmsTemplate(req: Request, res: Response): Promise<void> {
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

  public static async sendWhatsApp(req: Request, res: Response): Promise<void> {
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

  public static async sendWhatsAppTemplate(req: Request, res: Response): Promise<void> {
    const { to, templateName, languageCode, components } = req.body;

    if (!to || !templateName) {
      res.status(400).json({
        success: false,
        status: 'invalid_request',
        message: 'Both "to" and "templateName" fields are required',
      });
      return;
    }

    const result = await whatsAppService.sendTemplateWhatsApp(
      to,
      templateName,
      languageCode || 'en',
      Array.isArray(components) ? components : []
    );
    const statusCode = result.status === 'invalid_recipient' ? 400 : 200;
    res.status(statusCode).json(result);
  }
}
