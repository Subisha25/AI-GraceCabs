"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceAuthMiddleware = serviceAuthMiddleware;
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
function serviceAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        logger_1.logger.warn({
            channel: 'system',
            event: 'AUTH_FAILURE',
            error: 'Missing Authorization header',
            path: req.originalUrl,
            ip: req.ip,
        });
        res.status(401).json({
            success: false,
            status: 'unauthorized',
            message: 'Missing Authorization header',
        });
        return;
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        logger_1.logger.warn({
            channel: 'system',
            event: 'AUTH_FAILURE',
            error: 'Malformed Authorization header format (Expected Bearer <token>)',
            path: req.originalUrl,
        });
        res.status(401).json({
            success: false,
            status: 'unauthorized',
            message: 'Invalid Authorization header format',
        });
        return;
    }
    const token = parts[1];
    if (token !== env_1.config.serviceToken) {
        logger_1.logger.warn({
            channel: 'system',
            event: 'AUTH_FAILURE',
            error: 'Invalid service token',
            path: req.originalUrl,
        });
        res.status(401).json({
            success: false,
            status: 'unauthorized',
            message: 'Invalid service authentication token',
        });
        return;
    }
    next();
}
