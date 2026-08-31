"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    if (req.path !== '/api/health') {
        logger_1.logger.info({
            channel: 'system',
            event: 'INCOMING_REQUEST',
            method: req.method,
            path: req.originalUrl,
            ip: req.ip,
        });
    }
    next();
});
app.use('/api', notificationRoutes_1.default);
app.use((req, res) => {
    res.status(404).json({
        success: false,
        status: 'not_found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
});
app.use((err, req, res, next) => {
    logger_1.logger.error({
        channel: 'system',
        event: 'UNHANDLED_EXCEPTION',
        error: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
    res.status(500).json({
        success: false,
        status: 'server_error',
        message: 'An internal server error occurred in notification service',
    });
});
exports.default = app;
