import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import winston from 'winston';
import winstonDaily from 'winston-daily-rotate-file';
import { LOG_DIR } from '../config';


// logs dir
const logDir: string = join(__dirname, String(LOG_DIR) ||"../logs");

if (!existsSync(logDir)) {
  mkdirSync(logDir);
}

// Fonction pour sanitizer les logs (masquer tokens, passwords, secrets)
const sanitizeMessage = (message: any): string => {
  if (typeof message !== 'string') {
    message = JSON.stringify(message);
  }
  // Masquer les tokens JWT
  message = message.replace(/Bearer\s+[\w\-._~+\/]+=*/gi, 'Bearer [REDACTED]');
  // Masquer les mots de passe
  message = message.replace(/password["\s:=]+[^\s"',}]+/gi, 'password: [REDACTED]');
  message = message.replace(/"password":\s*"[^"]*"/gi, '"password": "[REDACTED]"');
  // Masquer les tokens
  message = message.replace(/token["\s:=]+[^\s"',}]+/gi, 'token: [REDACTED]');
  message = message.replace(/"token":\s*"[^"]*"/gi, '"token": "[REDACTED]"');
  // Masquer les secrets
  message = message.replace(/secret["\s:=]+[^\s"',}]+/gi, 'secret: [REDACTED]');
  message = message.replace(/"secret":\s*"[^"]*"/gi, '"secret": "[REDACTED]"');
  // Masquer les clés d'API
  message = message.replace(/(api[_-]?key|apikey)["\s:=]+[^\s"',}]+/gi, 'apikey: [REDACTED]');
  message = message.replace(/"api[_-]?key":\s*"[^"]*"/gi, '"apikey": "[REDACTED]"');
  return message;
};

// Define log format avec sanitization
const logFormat = winston.format.printf(({ timestamp, level, message }) => {
  const sanitizedMessage = sanitizeMessage(message);
  return `${timestamp} ${level}: ${sanitizedMessage}`;
});

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    logFormat,
  ),
  transports: [
    // debug log setting
    new winstonDaily({
      level: 'debug',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/debug', // log file /logs/debug/*.log in save
      filename: `%DATE%.log`,
      maxFiles: 30, // 30 Days saved
      json: false,
      zippedArchive: true,
    }),
    // error log setting
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/error', // log file /logs/error/*.log in save
      filename: `%DATE%.log`,
      maxFiles: 30, // 30 Days saved
      handleExceptions: true,
      json: false,
      zippedArchive: true,
    }),
  ],
});

logger.add(
  new winston.transports.Console({
    format: winston.format.combine(winston.format.splat(), winston.format.colorize()),
  }),
);

const stream = {
  write: (message: string) => {
     const msg = message.endsWith('\n') ? message.slice(0, -1) : message;
    logger.info(msg);
  },
};

export { logger, stream };
