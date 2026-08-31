"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const metaWhatsAppProvider_1 = require("../providers/whatsapp/metaWhatsAppProvider");
class WhatsAppService {
    provider;
    constructor() {
        this.provider = new metaWhatsAppProvider_1.MetaWhatsAppProvider();
    }
    async sendWhatsApp(to, message) {
        if (!to || typeof to !== 'string' || to.trim() === '') {
            return {
                success: false,
                provider: 'meta',
                status: 'invalid_recipient',
                message: 'Recipient mobile number is required',
            };
        }
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return {
                success: false,
                provider: 'meta',
                status: 'provider_failure',
                message: 'Message body cannot be empty',
            };
        }
        return this.provider.sendTextMessage(to.trim(), message.trim());
    }
    async sendTemplateWhatsApp(to, templateName, languageCode = 'en', components = []) {
        if (!to || typeof to !== 'string' || to.trim() === '') {
            return {
                success: false,
                provider: 'meta',
                status: 'invalid_recipient',
                message: 'Recipient mobile number is required',
            };
        }
        if (!templateName || typeof templateName !== 'string' || templateName.trim() === '') {
            return {
                success: false,
                provider: 'meta',
                status: 'provider_failure',
                message: 'Template name is required',
            };
        }
        return this.provider.sendTemplateMessage(to.trim(), templateName.trim(), languageCode, components);
    }
}
exports.WhatsAppService = WhatsAppService;
