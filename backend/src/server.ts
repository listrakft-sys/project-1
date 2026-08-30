import http from 'http';
import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';

const app = createApp();
const server = http.createServer(app);

// Socket.io will be initialized here once the messages module is ready
// import { Server as SocketServer } from 'socket.io';
// export const io = new SocketServer(server, { cors: { origin: config.clientUrl } });

server.listen(config.port, () => {
  logger.info(`🚀 School Platform API running on port ${config.port}`);
  logger.info(`   Environment: ${config.env}`);
  logger.info(`   Client URL: ${config.clientUrl}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received — shutting down');
  server.close(() => process.exit(0));
});

export { server };
