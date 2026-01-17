import { cleanEnv, port, str, email, url, num } from 'envalid';

export const ValidateEnv = () => {
  cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'production', 'test'] }),
    PORT: port(),
    SECRET_KEY: str({ desc: 'Secret key for JWT tokens' }),
    ACCESS_SECRET_KEY: str({ desc: 'Access token secret key' }),
    REFRESH_TOKEN_SECRET: str({ desc: 'Refresh token secret key' }),
    SESSION_SECRET: str({ desc: 'Session secret key' }),
    ORIGIN: url({ desc: 'Frontend origin URL' }),
    DATABASE_URL: str({ desc: 'PostgreSQL database URL' }),
    REDIS_PASSWORD: str({ desc: 'Redis password' }),
    EMAIL: email({ desc: 'Email address for notifications' }),
    MAILJET_API_KEY: str({ desc: 'Mailjet API key' }),
    MAILJET_API_SECRET_KEY: str({ desc: 'Mailjet API secret key' }),
    GOOGLE_CLIENT_ID: str({ desc: 'Google OAuth client ID' }),
    GOOGLE_CLIENT_SECRET: str({ desc: 'Google OAuth client secret' }),
    TWILIO_CLIENT_ID: str({ desc: 'Twilio client ID', default: '' }),
    TWILIO_CLIENT_SECRET: str({ desc: 'Twilio client secret', default: '' }),
    TWO_FA_SECRET_KEY: str({ desc: 'Two-factor authentication secret key' }),
    VERIFICATION_EMAIL_LINK: url({ desc: 'Email verification link base URL' }),
    SERVEUR_URL: url({ desc: 'Server URL' }),
    LOG_FORMAT: str({ choices: ['dev', 'combined'], default: 'dev' }),
    LOG_DIR: str({ default: '../logs' }),
    EXPIRES_IN: str({ default: '1h' }),
    ACCESS_TOKEN_EXPIRES_IN: str({ default: '15m' }),
    REFRESH_TOKEN_EXPIRES_IN: str({ default: '7d' }),
    EXPIRES_TOKEN_VERIFICATION_EMAIL: num({ default: 172800000 }), // 48h en ms
    NUMBER_OF_FAIL_BEFORE_LOCK: num({ default: 5 }),
    TIME_LOCK: num({ default: 1800000 }), // 30 min en ms
    MAX_ACTIVE_SESSIONS: num({ default: 5 }),
    EXPIRES_SESSION: str({ default: '7d' }),
    CREDENTIALS: str({ choices: ['true', 'false'], default: 'true' }),
  });
};
