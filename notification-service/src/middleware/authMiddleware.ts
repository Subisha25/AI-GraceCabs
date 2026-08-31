import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export function serviceAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.warn({
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
    logger.warn({
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
  if (token !== config.serviceToken) {
    logger.warn({
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
