const rateLimit = require('express-rate-limit');

/**
 * Auth Limiter: 5 requests per minute per IP.
 * Applied to login and register routes.
 */
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many requests from this IP, please try again after a minute',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Submission Limiter: 10 requests per minute strictly per user ID.
 * Applied only to authenticated routes (requireAuth must be called first).
 */
const submissionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  keyGenerator: (req, res) => {
    // Use user id when available; fall back to IP to avoid runtime errors
    return req.user?.id || req.user?._id || req.user?.sub || rateLimit.ipKeyGenerator(req, res);
  },
  message: 'Too many submissions, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Join Limiter: Stricter limit for anonymous contest joins (2 requests per minute per IP).
 */
const joinLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 2,
  message: 'Too many join attempts, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  submissionLimiter,
  joinLimiter,
};
