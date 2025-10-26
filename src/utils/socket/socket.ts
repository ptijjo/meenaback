import { Server } from 'socket.io';

let io: Server | null = null;

export const setIo = (instance: Server) => {
  io = instance;
};

export const getIo = (): Server => {
  if (!io) {
    console.warn('⚠️ Tentative d’accès à Socket.IO avant initialisation !');
    throw new Error("Socket.Io n'est pas encore initialisé !");
  }

  return io;
};
