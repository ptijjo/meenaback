import { NextFunction, Response } from 'express';
import { HttpException } from '../exceptions/httpException';
import { RequestWithUser,} from '../interfaces/auth.interface';
import prisma from '../utils/prisma';


// Calcule la durée de vie du cache une seule fois
export const AuthSecretMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {

    if (!req.user || !req.user.id) {
      return next(new HttpException(401, 'Utilisateur non authentifié'));
    }

    const userId = req.user.id;
    

    const findUserSecret = await prisma.userSecret.findUnique({ where: { userId: String(userId) } });

    if (findUserSecret) {
      req.userSecret = findUserSecret;
      return next();
    } else {
      return next(new HttpException(401, 'UserSecret introuvable'));
    }
  } catch (error) {
   
    console.error('Authentification error:', error.name, error.message);
    return next(new HttpException(500, "Erreur interne d'authentification"));
  }
};
