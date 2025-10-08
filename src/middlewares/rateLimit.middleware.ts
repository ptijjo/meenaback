import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 requêtes par IP
  message: 'Trop de tentatives, réessayez plus tard',
  skipSuccessfulRequests: true, // ne compte pas les requêtes réussies
});
