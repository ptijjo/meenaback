import { SECRET_KEY } from '../config';
import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import prisma from '../utils/prisma';
import { DataStoredInToken } from '../interfaces/auth.interface';

export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Token non fourni"));
  }

  try {
    const decoded = jwt.verify(token, String(SECRET_KEY))as DataStoredInToken;
    const userSecret = await prisma.userSecret.findUnique({ where: { userId: decoded.id } });
    socket.data.user = userSecret;
    next();
  } catch (error) {
   console.error("❌ Erreur socket JWT :", error.message);
    next(new Error("Token invalide"));
  }
};