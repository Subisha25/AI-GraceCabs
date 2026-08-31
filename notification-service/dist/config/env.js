"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.config = {
    port: parseInt(process.env.PORT || '5001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    serviceToken: process.env.NOTIFICATION_SERVICE_TOKEN || 'grace_internal_notif_sec_key_2026',
    sms: {
        provider: process.env.SMS_PROVIDER || '2factor',
        apiKey: process.env.TWO_FACTOR_API_KEY || '',
        senderId: process.env.TWO_FACTOR_SENDER_ID || 'SWIFTR',
        templateName: process.env.TWO_FACTOR_TEMPLATE_NAME || 'SwiftRideOTP',
        baseUrl: process.env.TWO_FACTOR_BASE_URL || 'https://2factor.in/API',
    },
    whatsapp: {
        provider: process.env.WHATSAPP_PROVIDER || 'meta',
        token: process.env.META_WHATSAPP_TOKEN || '',
        phoneId: process.env.META_WHATSAPP_PHONE_ID || '',
        graphApiVersion: process.env.META_GRAPH_API_VERSION || 'v21.0',
    }
};
