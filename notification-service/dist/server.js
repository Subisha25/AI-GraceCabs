"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const PORT = env_1.config.port;
const server = app_1.default.listen(PORT, () => {
    logger_1.logger.info({
        channel: 'system',
        event: 'SERVICE_STARTED',
        message: `Grace Cabs Notification Microservice running on port ${PORT} [${env_1.config.nodeEnv}]`,
    });
});
process.on('SIGTERM', () => {
    logger_1.logger.info({
        channel: 'system',
        event: 'SERVICE_SHUTDOWN',
        message: 'SIGTERM received, shutting down gracefully',
    });
    server.close(() => {
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.logger.info({
        channel: 'system',
        event: 'SERVICE_SHUTDOWN',
        message: 'SIGINT received, shutting down gracefully',
    });
    server.close(() => {
        process.exit(0);
    });
});
exports.default = server;
