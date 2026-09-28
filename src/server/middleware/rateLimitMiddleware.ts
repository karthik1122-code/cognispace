import rateLimit from 'express-rate-limit';

/**
 * AI API Rate Limiting Middleware
 * Protects expensive LLM transformation endpoints from spam and abuse.
 * Allows up to 30 requests per minute per IP address.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 30, // Limit each IP to 30 requests per minute
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many AI transformation requests. Please slow down and try again in a minute.',
  },
});

export default aiRateLimiter;
