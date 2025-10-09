import { Role } from '@prisma/client';
import { NextFunction,Response } from 'express';
import { RequestWithUser } from '../interfaces/auth.interface';
import { HttpException } from '../exceptions/httpException';

const validateUserRoles = userRoles => {
  if (!Array.isArray(userRoles)) {
    userRoles = [userRoles];
  }
  return userRoles.map((role: string) => {
    if (!Role[role]) throw new Error(`Rôle invalide: ${role}`);
    return Role[role];
  });
};

export const RoleGuard = (requiredRoles = []) => {
  return (req:RequestWithUser, res:Response, next:NextFunction) => {
    if (!requiredRoles.length) return next();

    const user = req.user;
    if (!user) return next(new HttpException(409, 'Utilisateur non authentifié'));

    try {
      const userRoles = validateUserRoles(user.role);

      const hasRole = requiredRoles.some(role => {
        console.log('Role autorisé :', role);
        return userRoles.includes(role);
      });

      if (!hasRole) return next(new HttpException(409, 'Accès interdit'));
      next();
    } catch (error) {
      return next(new HttpException(400, error.message));
    }
  };
};