import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { ACCESS_TOKEN_EXPIRES_IN, SECRET_KEY } from '../config';
import { HttpException } from '../exceptions/httpException';
import { RequestWithUser, DataStoredInToken } from '../interfaces/auth.interface';
import { cacheService } from '../server';
import prisma from '../utils/prisma';

// Calcule la durée de vie du cache une seule fois
const CACHE_TTL: number = Number(ACCESS_TOKEN_EXPIRES_IN);

const getAuthorization = req => {
  const header = req.header('Authorization');
  if (header) return header.split('Bearer ')[1];
  return null;
};

export const AuthMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const Authorization = getAuthorization(req);

    if (!Authorization) {
      return next(new HttpException(401, 'Authentication token missing'));
    }
    
    // 1. Décode le JWT pour obtenir l'ID (cela gère les erreurs de signature/expiration)
    const decoded = verify(Authorization, SECRET_KEY as string) as DataStoredInToken;
    const userId = decoded.id;

    // 2. Nouvelle clé de cache : basée sur l'ID utilisateur
    // Note: Utiliser 'auth:' ou 'user:' est une convention. 'user:' est très clair.
    const cacheKey = `user:${userId}`; 

    // 3. Cherche d’abord l’utilisateur dans Redis (Cache Hit)
    const cachedUser = await cacheService.get(cacheKey);

    console.log("user dans le cache redis : ",cachedUser)
    if (cachedUser) {
      req.user = cachedUser;
      return next();
    }

    // 4. Récupère l’utilisateur depuis la DB (Cache Miss)
    const findUser = await prisma.user.findUnique({ where: { id: String(userId) } });

    if (findUser) {
      // 5. Met l’utilisateur en cache
      // console.log("le ttl de redis est : ", CACHE_TTL);
      await cacheService.set(cacheKey, findUser, CACHE_TTL);

      req.user = findUser;
      return next();
    } else {
      return next(new HttpException(401, 'Wrong authentication token'));
    }
  } catch (error) {
    // Erreur lors du décodage (token expiré, signature invalide, etc.)
    console.error('JWT Verification Error:', error.name, error.message);
    return next(new HttpException(401, 'Wrong authentication token')); 
  }
};
