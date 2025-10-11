import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 15, // max 15 requêtes par IP
  message: 'Trop de tentatives, réessayez plus tard',
  skipSuccessfulRequests: false, //  compte les requêtes réussies
});
