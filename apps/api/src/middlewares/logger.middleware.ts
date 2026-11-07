import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, originalUrl } = req;

  // Mask any query parameters that could contain sensitive tokens or keys
  const sanitizedUrl = originalUrl.replace(/(token|key|password|secret|auth)=[^&]+/gi, '$1=[REDACTED]');

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    // Safe structured log message
    const logMessage = `[${new Date().toISOString()}] ${method} ${sanitizedUrl} ${statusCode} - ${duration}ms`;

    if (statusCode >= 500) {
      console.error(logMessage);
    } else if (statusCode >= 400) {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }
  });

  next();
}
