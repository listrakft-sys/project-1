import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler, notFound } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';
import { localize } from './middleware/localize';
import routes from './routes';

export function createApp(): Application {
  const app = express();

  // Security
  app.use(helmet());
  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
    }),
  );

  // Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging
  if (config.isDev) {
    app.use(morgan('dev'));
  }

  // Rate limiting
  app.use(apiRateLimiter);

  // Localization
  app.use(localize);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api/v1', routes);

  // 404
  app.use(notFound);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
