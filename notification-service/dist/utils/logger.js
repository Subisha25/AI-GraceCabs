"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.maskPhoneNumber = maskPhoneNumber;
function maskPhoneNumber(phone) {
    if (!phone)
        return '[empty]';
    const clean = phone.trim();
    if (clean.length <= 4)
        return '****';
    const prefix = clean.slice(0, 4);
    const suffix = clean.slice(-4);
    return `${prefix}****${suffix}`;
}
exports.logger = {
    info: (entry) => {
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
    warn: (entry) => {
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
    error: (entry) => {
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
