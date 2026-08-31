"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaWhatsAppProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../../config/env");
const logger_1 = require("../../utils/logger");
class MetaWhatsAppProvider {
    get token() {
        return env_1.config.whatsapp.token;
    }
    get phoneId() {
        return env_1.config.whatsapp.phoneId;
    }
    get apiVersion() {
        return env_1.config.whatsapp.graphApiVersion;
    }
    constructor() { }
    formatRecipient(to) {
        let clean = to.trim();
        if (clean.startsWith('+')) {
            return clean;
        }
        const digitsOnly = clean.replace(/[^0-9]/g, '');
        if (digitsOnly.length === 10) {
            return `+91${digitsOnly}`;
        }
        return `+${digitsOnly}`;
    }
    async sendTextMessage(to, message) {
        const formattedRecipient = this.formatRecipient(to);
        if (!formattedRecipient || formattedRecipient.length < 10) {
            return {
                success: false,
                provider: 'meta',
                status: 'invalid_recipient',
                message: 'Recipient mobile number is invalid or empty',
            };
        }
        if (!this.token || !this.phoneId) {
            logger_1.logger.warn({
                channel: 'whatsapp',
                event: 'WHATSAPP_SKIPPED_CONFIG_MISSING',
                recipient: formattedRecipient,
                provider: 'meta',
                status: 'configuration_missing',
            });
            return {
                success: false,
                provider: 'meta',
                status: 'configuration_missing',
                message: 'META_WHATSAPP_TOKEN or META_WHATSAPP_PHONE_ID is not configured',
            };
        }
        try {
            const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneId}/messages`;
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: formattedRecipient,
                type: 'text',
                text: {
                    preview_url: false,
                    body: message,
                },
            };
            const response = await axios_1.default.post(url, payload, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });
            const data = response.data;
            const messageId = data?.messages?.[0]?.id || 'sent';
            logger_1.logger.info({
                channel: 'whatsapp',
                event: 'WHATSAPP_TEXT_SENT',
                recipient: formattedRecipient,
                provider: 'meta',
                status: 'sent',
                messageId,
            });
            return {
                success: true,
                provider: 'meta',
                messageId,
                status: 'sent',
                rawResponse: data,
            };
        }
        catch (error) {
            const errMsg = error.response?.data?.error?.message ||
                error.response?.data?.message ||
                error.message ||
                'Unknown Meta Graph API error';
            logger_1.logger.error({
                channel: 'whatsapp',
                event: 'WHATSAPP_SEND_ERROR',
                recipient: formattedRecipient,
                provider: 'meta',
                status: 'provider_failure',
                error: errMsg,
            });
            return {
                success: false,
                provider: 'meta',
                status: 'provider_failure',
                message: errMsg,
                rawResponse: error.response?.data,
            };
        }
    }
    async sendTemplateMessage(to, templateName, languageCode = 'en', components = []) {
        const formattedRecipient = this.formatRecipient(to);
        if (!formattedRecipient || formattedRecipient.length < 10) {
            return {
                success: false,
                provider: 'meta',
                status: 'invalid_recipient',
                message: 'Recipient mobile number is invalid or empty',
            };
        }
        if (!this.token || !this.phoneId) {
            logger_1.logger.warn({
                channel: 'whatsapp',
                event: 'WHATSAPP_TEMPLATE_SKIPPED_CONFIG_MISSING',
                recipient: formattedRecipient,
                provider: 'meta',
                status: 'configuration_missing',
            });
            return {
                success: false,
                provider: 'meta',
                status: 'configuration_missing',
                message: 'META_WHATSAPP_TOKEN or META_WHATSAPP_PHONE_ID is not configured',
            };
        }
        try {
            const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneId}/messages`;
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: formattedRecipient,
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: languageCode,
                    },
                    ...(components.length > 0 ? { components } : {}),
                },
            };
            const response = await axios_1.default.post(url, payload, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });
            const data = response.data;
            const messageId = data?.messages?.[0]?.id || 'sent';
            logger_1.logger.info({
                channel: 'whatsapp',
                event: 'WHATSAPP_TEMPLATE_SENT',
                recipient: formattedRecipient,
                provider: 'meta',
                status: 'sent',
                messageId,
            });
            return {
                success: true,
                provider: 'meta',
                messageId,
                status: 'sent',
                rawResponse: data,
            };
        }
        catch (error) {
            const errMsg = error.response?.data?.error?.message ||
                error.response?.data?.message ||
                error.message ||
                'Unknown Meta Graph API error';
            logger_1.logger.error({
                channel: 'whatsapp',
                event: 'WHATSAPP_TEMPLATE_SEND_ERROR',
                recipient: formattedRecipient,
                provider: 'meta',
                status: 'provider_failure',
                error: errMsg,
            });
            return {
                success: false,
                provider: 'meta',
                status: 'provider_failure',
                message: errMsg,
                rawResponse: error.response?.data,
            };
        }
    }
}
exports.MetaWhatsAppProvider = MetaWhatsAppProvider;
