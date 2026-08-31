"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const twoFactorProvider_1 = require("../providers/sms/twoFactorProvider");
class SmsService {
    provider;
    constructor() {
        this.provider = new twoFactorProvider_1.TwoFactorSmsProvider();
    }
    async sendSms(to, message) {
        if (!to || typeof to !== 'string' || to.trim() === '') {
            return {
                success: false,
                provider: '2factor',
                status: 'invalid_recipient',
                message: 'Recipient mobile number is required',
            };
        }
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return {
                success: false,
                provider: '2factor',
                status: 'provider_failure',
                message: 'Message body cannot be empty',
            };
        }
        return this.provider.sendDirectSms(to.trim(), message.trim());
    }
    async sendTemplateSms(to, templateName, variables = []) {
        if (!to || typeof to !== 'string' || to.trim() === '') {
            return {
                success: false,
                provider: '2factor',
                status: 'invalid_recipient',
                message: 'Recipient mobile number is required',
            };
        }
        if (!templateName || typeof templateName !== 'string' || templateName.trim() === '') {
            return {
                success: false,
                provider: '2factor',
                status: 'provider_failure',
                message: 'Template name is required',
            };
        }
        return this.provider.sendTemplateSms(to.trim(), templateName.trim(), variables);
    }
}
exports.SmsService = SmsService;
