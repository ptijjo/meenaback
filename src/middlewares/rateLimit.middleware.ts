import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 15, // max 15 requêtes par IP
  message: 'Trop de tentatives, réessayez plus tard',
  skipSuccessfulRequests: false, //  compte les requêtes réussies
});

export const messageRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // max 30 messages par minute par IP
  message: 'Trop de messages envoyés, veuillez ralentir',
  skipSuccessfulRequests: true, // Ne compte que les requêtes réussies
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 uploads par 15 minutes par IP
  message: 'Trop de fichiers uploadés, réessayez plus tard',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});
