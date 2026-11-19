import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { errorResponse } from '../../utils/response.util';

/**
 * Per-User Rate Limiter for AI Endpoints.
 * Enforces max 15 requests per minute per authenticated user (or IP fallback).
 */
export const aiPerUserRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 15, // Max 15 AI requests per minute
  keyGenerator: (req: Request) => {
    // Key by authenticated user ID if present; fallback to IP
    const user = req.user || (req as any).currentUser;
    if (user?.id) {
      return `ai_user_${user.id}`;
    }
    return `ai_ip_${req.ip || 'unknown'}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  handler: (req: Request, res: Response) => {
    res.status(429).json(
      errorResponse(
        'TOO_MANY_REQUESTS',
        'AI rate limit exceeded for this user account. Please wait 1 minute before requesting further AI suggestions.'
      )
    );
  },
});
