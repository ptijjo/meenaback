import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const { NODE_ENV, PORT, SECRET_KEY, LOG_FORMAT, LOG_DIR, ORIGIN,EXPIRES_IN,MAX_ACTIVE_SESSIONS,EXPIRES_SESSION,ACCESS_SECRET_KEY,ACCESS_TOKEN_EXPIRES_IN,REFRESH_TOKEN_SECRET,REFRESH_TOKEN_EXPIRES_IN } = process.env;
