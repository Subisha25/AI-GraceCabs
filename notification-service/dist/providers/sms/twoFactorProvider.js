"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorSmsProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../../config/env");
const logger_1 = require("../../utils/logger");
class TwoFactorSmsProvider {
    get apiKey() {
        return env_1.config.sms.apiKey;
    }
    get senderId() {
        return env_1.config.sms.senderId;
    }
    get defaultTemplate() {
        return env_1.config.sms.templateName;
    }
    get baseUrl() {
        return env_1.config.sms.baseUrl;
    }
    constructor() { }
    cleanPhoneNumber(to) {
        let clean = to.replace(/[^0-9]/g, '');
        if (clean.length > 10 && clean.startsWith('91')) {
            clean = clean.substring(2);
        }
        return clean;
    }
    async sendDirectSms(to, message) {
        const cleanPhone = this.cleanPhoneNumber(to);
        if (!cleanPhone || cleanPhone.length < 10) {
            return {
                success: false,
                provider: '2factor',
                status: 'invalid_recipient',
                message: 'Recipient mobile number is invalid or too short',
            };
        }
        if (!this.apiKey) {
            logger_1.logger.warn({
                channel: 'sms',
                event: 'SMS_SKIPPED_CONFIG_MISSING',
                recipient: to,
                provider: '2factor',
                status: 'configuration_missing',
            });
            return {
                success: false,
                provider: '2factor',
                status: 'configuration_missing',
                message: 'TWO_FACTOR_API_KEY is not configured in environment',
            };
        }
        try {
            const otpMatch = message.match(/(?:otp|code|verification code is:?)\s*([0-9]{4,6})/i);
            if (otpMatch) {
                const otpVal = otpMatch[1];
                const templateName = this.defaultTemplate || 'SwiftRideOTP';
                const url = `${this.baseUrl}/V1/${this.apiKey}/SMS/${cleanPhone}/${otpVal}/${templateName}`;
                const response = await axios_1.default.get(url, { timeout: 10000 });
                const data = response.data;
                if (data && (data.Status === 'Success' || response.status === 200)) {
                    logger_1.logger.info({
                        channel: 'sms',
                        event: 'OTP_SMS_SENT',
                        recipient: to,
                        provider: '2factor',
                        status: 'sent',
                        messageId: data.Details || data.SessionId || 'sent',
                    });
                    return {
                        success: true,
                        provider: '2factor',
                        messageId: data.Details || data.SessionId || 'sent',
                        status: 'sent',
                        rawResponse: data,
                    };
                }
                return {
                    success: false,
                    provider: '2factor',
                    status: 'provider_failure',
                    message: data?.Details || '2Factor gateway rejected the OTP request',
                    rawResponse: data,
                };
            }
            const url = `${this.baseUrl}/V1/${this.apiKey}/ADDON_SERVICES/SEND/TSMS`;
            const response = await axios_1.default.post(url, {
                From: this.senderId,
                To: cleanPhone,
                Msg: message,
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000,
            });
            const data = response.data;
            if (data && (data.Status === 'Success' || response.status === 200)) {
                logger_1.logger.info({
                    channel: 'sms',
                    event: 'DIRECT_SMS_SENT',
                    recipient: to,
                    provider: '2factor',
                    status: 'sent',
                    messageId: data.Details || 'sent',
                });
                return {
                    success: true,
                    provider: '2factor',
                    messageId: data.Details || 'sent',
                    status: 'sent',
                    rawResponse: data,
                };
            }
            return {
                success: false,
                provider: '2factor',
                status: 'provider_failure',
                message: data?.Details || '2Factor gateway rejected the message',
                rawResponse: data,
            };
        }
        catch (error) {
            const errMsg = error.response?.data?.Details || error.response?.data?.message || error.message || 'Unknown network error';
            logger_1.logger.error({
                channel: 'sms',
                event: 'SMS_SEND_ERROR',
                recipient: to,
                provider: '2factor',
                status: 'provider_failure',
                error: errMsg,
            });
            return {
                success: false,
                provider: '2factor',
                status: 'provider_failure',
                message: errMsg,
                rawResponse: error.response?.data,
            };
        }
    }
    async sendTemplateSms(to, templateName, variables = []) {
        const cleanPhone = this.cleanPhoneNumber(to);
        if (!cleanPhone || cleanPhone.length < 10) {
            return {
                success: false,
                provider: '2factor',
                status: 'invalid_recipient',
                message: 'Recipient mobile number is invalid or too short',
            };
        }
        if (!this.apiKey) {
            logger_1.logger.warn({
                channel: 'sms',
                event: 'SMS_TEMPLATE_SKIPPED_CONFIG_MISSING',
                recipient: to,
                provider: '2factor',
                status: 'configuration_missing',
            });
            return {
                success: false,
                provider: '2factor',
                status: 'configuration_missing',
                message: 'TWO_FACTOR_API_KEY is not configured in environment',
            };
        }
        try {
            const params = {
                module: 'TRANS_SMS',
                apikey: this.apiKey,
                to: cleanPhone,
                from: this.senderId,
                templatename: templateName,
            };
            variables.forEach((val, idx) => {
                params[`var${idx + 1}`] = val;
            });
            const queryStr = new URLSearchParams(params).toString();
            const url = `${this.baseUrl}/R1/?${queryStr}`;
            const response = await axios_1.default.get(url, { timeout: 10000 });
            const data = response.data;
            if (data && (data.Status === 'Success' || response.status === 200)) {
                logger_1.logger.info({
                    channel: 'sms',
                    event: 'TEMPLATE_SMS_SENT',
                    recipient: to,
                    provider: '2factor',
                    status: 'sent',
                    messageId: data.Details || 'sent',
                });
                return {
                    success: true,
                    provider: '2factor',
                    messageId: data.Details || 'sent',
                    status: 'sent',
                    rawResponse: data,
                };
            }
            return {
                success: false,
                provider: '2factor',
                status: 'provider_failure',
                message: data?.Details || '2Factor gateway rejected the template SMS',
                rawResponse: data,
            };
        }
        catch (error) {
            const errMsg = error.response?.data?.Details || error.response?.data?.message || error.message || 'Unknown network error';
            logger_1.logger.error({
                channel: 'sms',
                event: 'SMS_TEMPLATE_SEND_ERROR',
                recipient: to,
                provider: '2factor',
                status: 'provider_failure',
                error: errMsg,
            });
            return {
                success: false,
                provider: '2factor',
                status: 'provider_failure',
                message: errMsg,
                rawResponse: error.response?.data,
            };
        }
    }
}
exports.TwoFactorSmsProvider = TwoFactorSmsProvider;
