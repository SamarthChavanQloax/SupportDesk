import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { requestLogger } from './middlewares/logger.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { apiRouter } from './routes';
import { errorResponse } from './utils/response.util';

export function createApp(): Application {
  const app = express();

  // 1. Security Headers via Helmet (OWASP A05:2021 Security Misconfiguration)
  app.use(helmet());

  // 2. Strict CORS allowlist from validated environment configuration
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (such as mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        // Reject unapproved origins without issuing CORS permission headers
        return callback(null, false);
      },
      credentials: true,
    })
  );

  // 3. Core body parsing middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 4. Safe request logging middleware
  app.use(requestLogger);

  // 5. Mount API Routes (accessible at /health, /auth, /tickets and /api/*)
  app.use('/', apiRouter);
  app.use('/api', apiRouter);

  // 6. Handle 404 for unknown endpoints
  app.use((req: Request, res: Response) => {
    res.status(404).json(
      errorResponse('NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`)
    );
  });

  // 7. Central Error Handler (must be registered after all routes)
  app.use(errorHandler);

  return app;
}

export const app = createApp();
