import * as cookie from 'cookie';
import { SECRET_KEY } from '../config';
import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  const cookies = socket.handshake.headers?.cookie;

  if (!cookies) {
    return next(new Error('Aucun cookie trouvé !'));
  }

  const parsedCookies = cookie.parse(cookies);
  const token = parsedCookies?.token?.replace('Bearer ', '');


  if (!token) {
    return next(new Error('Token non fourni'));
  }

  try {
    const decoded = jwt.verify(token, String(SECRET_KEY));
    socket.data.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Token expiré'));
    }

    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Token invalide'));
    }

    return next(new Error("Erreur d'authentification"));
  }
};