import { TwoFactorSmsProvider, SmsSendResult } from '../providers/sms/twoFactorProvider';

export class SmsService {
  private provider: TwoFactorSmsProvider;

  constructor() {
    this.provider = new TwoFactorSmsProvider();
  }

  public async sendSms(to: string, message: string): Promise<SmsSendResult> {
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

  public async sendTemplateSms(to: string, templateName: string, variables: string[] = []): Promise<SmsSendResult> {
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
