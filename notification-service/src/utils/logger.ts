export function maskPhoneNumber(phone?: string): string {
  if (!phone) return '[empty]';
  const clean = phone.trim();
  if (clean.length <= 4) return '****';
  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-4);
  return `${prefix}****${suffix}`;
}

export interface LogEntry {
  timestamp?: string;
  channel: 'sms' | 'whatsapp' | 'system';
  event: string;
  recipient?: string;
  provider?: string;
  status?: string;
  success?: boolean;
  messageId?: string;
  error?: string;
  [key: string]: any;
}

export const logger = {
  info: (entry: LogEntry | string) => {
    const ts = new Date().toISOString();
    if (typeof entry === 'string') {
      console.log(`[${ts}] [INFO] ${entry}`);
      return;
    }
    const maskedRecipient = entry.recipient ? maskPhoneNumber(entry.recipient) : undefined;
    const formatted = {
      timestamp: ts,
      ...entry,
      ...(maskedRecipient ? { recipient: maskedRecipient } : {}),
    };
    console.log(`[${ts}] [INFO] [${entry.channel.toUpperCase()}] ${JSON.stringify(formatted)}`);
  },

  warn: (entry: LogEntry | string) => {
    const ts = new Date().toISOString();
    if (typeof entry === 'string') {
      console.warn(`[${ts}] [WARN] ${entry}`);
      return;
    }
    const maskedRecipient = entry.recipient ? maskPhoneNumber(entry.recipient) : undefined;
    const formatted = {
      timestamp: ts,
      ...entry,
      ...(maskedRecipient ? { recipient: maskedRecipient } : {}),
    };
    console.warn(`[${ts}] [WARN] [${entry.channel.toUpperCase()}] ${JSON.stringify(formatted)}`);
  },

  error: (entry: LogEntry | string) => {
    const ts = new Date().toISOString();
    if (typeof entry === 'string') {
      console.error(`[${ts}] [ERROR] ${entry}`);
      return;
    }
    const maskedRecipient = entry.recipient ? maskPhoneNumber(entry.recipient) : undefined;
    const formatted = {
      timestamp: ts,
      ...entry,
      ...(maskedRecipient ? { recipient: maskedRecipient } : {}),
    };
    console.error(`[${ts}] [ERROR] [${entry.channel.toUpperCase()}] ${JSON.stringify(formatted)}`);
  }
};
