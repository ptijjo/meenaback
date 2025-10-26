import { SECRET_KEY } from '../config';
import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Token non fourni"));
  }

  try {
    const decoded = jwt.verify(token, String(SECRET_KEY));
    socket.data.user = decoded;
    console.log("✅ Auth socket OK :", decoded);
    next();
  } catch (error) {
   console.error("❌ Erreur socket JWT :", error.message);
    next(new Error("Token invalide"));
  }
};