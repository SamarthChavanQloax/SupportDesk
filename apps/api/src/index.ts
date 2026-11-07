import { app } from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
  console.log(`[SupportDesk API] Server successfully started`);
  console.log(`[SupportDesk API] Listening on port: ${env.PORT}`);
  console.log(`[SupportDesk API] Environment: ${env.NODE_ENV}`);
  console.log(`[SupportDesk API] Health check available at: http://localhost:${env.PORT}/health`);
  console.log(`[SupportDesk API] Tickets endpoint available at: http://localhost:${env.PORT}/tickets`);
});

// Graceful shutdown handling
const shutdown = (signal: string) => {
  console.log(`[SupportDesk API] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[SupportDesk API] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
