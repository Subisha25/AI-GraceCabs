import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import notificationRoutes from './routes/notificationRoutes';
import { logger } from './utils/logger';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path !== '/api/health') {
    logger.info({
      channel: 'system',
      event: 'INCOMING_REQUEST',
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
    });
  }
  next();
});

app.use('/api', notificationRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    status: 'not_found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({
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

export default app;
