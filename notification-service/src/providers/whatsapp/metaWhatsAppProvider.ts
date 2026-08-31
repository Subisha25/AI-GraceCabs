import axios from 'axios';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';

export interface WhatsAppSendResult {
  success: boolean;
  provider: string;
  messageId?: string;
  status: 'sent' | 'configuration_missing' | 'provider_failure' | 'invalid_recipient';
  message?: string;
  rawResponse?: any;
}

export class MetaWhatsAppProvider {
  private get token(): string {
    return config.whatsapp.token;
  }

  private get phoneId(): string {
    return config.whatsapp.phoneId;
  }

  private get apiVersion(): string {
    return config.whatsapp.graphApiVersion;
  }

  constructor() {}

  private formatRecipient(to: string): string {
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

  public async sendTextMessage(to: string, message: string): Promise<WhatsAppSendResult> {
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
      logger.warn({
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

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      const data = response.data;
      const messageId = data?.messages?.[0]?.id || 'sent';

      logger.info({
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
    } catch (error: any) {
      const errMsg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Unknown Meta Graph API error';

      logger.error({
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

  public async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'en',
    components: any[] = []
  ): Promise<WhatsAppSendResult> {
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
      logger.warn({
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

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      const data = response.data;
      const messageId = data?.messages?.[0]?.id || 'sent';

      logger.info({
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
    } catch (error: any) {
      const errMsg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Unknown Meta Graph API error';

      logger.error({
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
