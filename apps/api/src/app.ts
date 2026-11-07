import express, { Application, Request, Response } from 'express';
import { requestLogger } from './middlewares/logger.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { apiRouter } from './routes';
import { errorResponse } from './utils/response.util';

export function createApp(): Application {
  const app = express();

  // 1. Core parsing middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 2. Safe request logging middleware
  app.use(requestLogger);

  // 3. Mount API Routes (accessible at /health, /tickets and /api/*)
  app.use('/', apiRouter);
  app.use('/api', apiRouter);

  // 4. Handle 404 for unknown endpoints
  app.use((req: Request, res: Response) => {
    res.status(404).json(
      errorResponse('NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`)
    );
  });

  // 5. Central Error Handler (must be registered after all routes)
  app.use(errorHandler);

  return app;
}

export const app = createApp();
