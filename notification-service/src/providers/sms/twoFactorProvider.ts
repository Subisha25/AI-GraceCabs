import axios from 'axios';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';

export interface SmsSendResult {
  success: boolean;
  provider: string;
  messageId?: string;
  status: 'sent' | 'configuration_missing' | 'provider_failure' | 'invalid_recipient';
  message?: string;
  rawResponse?: any;
}

export class TwoFactorSmsProvider {
  private get apiKey(): string {
    return config.sms.apiKey;
  }

  private get senderId(): string {
    return config.sms.senderId;
  }

  private get defaultTemplate(): string {
    return config.sms.templateName;
  }

  private get baseUrl(): string {
    return config.sms.baseUrl;
  }

  constructor() {}

  private cleanPhoneNumber(to: string): string {
    let clean = to.replace(/[^0-9]/g, '');
    if (clean.length > 10 && clean.startsWith('91')) {
      clean = clean.substring(2);
    }
    return clean;
  }

  public async sendDirectSms(to: string, message: string): Promise<SmsSendResult> {
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
      logger.warn({
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
        
        const response = await axios.get(url, { timeout: 10000 });
        const data = response.data;

        if (data && (data.Status === 'Success' || response.status === 200)) {
          logger.info({
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
      const response = await axios.post(
        url,
        {
          From: this.senderId,
          To: cleanPhone,
          Msg: message,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      const data = response.data;
      if (data && (data.Status === 'Success' || response.status === 200)) {
        logger.info({
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
    } catch (error: any) {
      const errMsg = error.response?.data?.Details || error.response?.data?.message || error.message || 'Unknown network error';
      logger.error({
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

  public async sendTemplateSms(to: string, templateName: string, variables: string[] = []): Promise<SmsSendResult> {
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
      logger.warn({
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
      const params: Record<string, string> = {
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

      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data;

      if (data && (data.Status === 'Success' || response.status === 200)) {
        logger.info({
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
    } catch (error: any) {
      const errMsg = error.response?.data?.Details || error.response?.data?.message || error.message || 'Unknown network error';
      logger.error({
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
