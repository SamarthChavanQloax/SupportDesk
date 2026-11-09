import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { errorResponse } from '../utils/response.util';

/**
 * Rate Limiter for Login Endpoint
 * Prevents brute-force and credential stuffing attacks (OWASP A07:2021)
 * Window: 15 minutes, Max: 10 requests per IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  standardHeaders: true, // Return standard RateLimit headers (RFC 7231)
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: (req: Request, res: Response) => {
    res.status(429).json(
      errorResponse(
        'TOO_MANY_REQUESTS',
        'Too many login attempts from this IP. Please try again after 15 minutes.'
      )
    );
  },
});

