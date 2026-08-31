import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info({
    channel: 'system',
    event: 'SERVICE_STARTED',
    message: `Grace Cabs Notification Microservice running on port ${PORT} [${config.nodeEnv}]`,
  });
});

process.on('SIGTERM', () => {
  logger.info({
    channel: 'system',
    event: 'SERVICE_SHUTDOWN',
    message: 'SIGTERM received, shutting down gracefully',
  });
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info({
    channel: 'system',
    event: 'SERVICE_SHUTDOWN',
    message: 'SIGINT received, shutting down gracefully',
  });
  server.close(() => {
    process.exit(0);
  });
});

export default server;
