import { MetaWhatsAppProvider, WhatsAppSendResult } from '../providers/whatsapp/metaWhatsAppProvider';

export class WhatsAppService {
  private provider: MetaWhatsAppProvider;

  constructor() {
    this.provider = new MetaWhatsAppProvider();
  }

  public async sendWhatsApp(to: string, message: string): Promise<WhatsAppSendResult> {
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

  public async sendTemplateWhatsApp(
    to: string,
    templateName: string,
    languageCode: string = 'en',
    components: any[] = []
  ): Promise<WhatsAppSendResult> {
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
