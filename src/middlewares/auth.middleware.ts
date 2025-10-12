import { PrismaClient } from '@prisma/client';
import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { SECRET_KEY } from '../config';
import { HttpException } from '../exceptions/httpException';
import { RequestWithUser, DataStoredInToken } from '../interfaces/auth.interface';



const getAuthorization = (req) => {
  // const coockie = req.cookies['Authorization'];
  // if (coockie) return coockie;

  const header = req.header('Authorization');
  if (header) return header.split('Bearer ')[1];

  return null;
}

export const AuthMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const Authorization = getAuthorization(req);

    if (Authorization) {

      const decoded = verify(Authorization, SECRET_KEY as string) as DataStoredInToken;
      console.log("on décode le refreshtoken : ",decoded)
      const users = new PrismaClient().user;
      const findUser = await users.findUnique({ where: { id: String(decoded.id) } });

      if (findUser) {
        req.user = findUser;
        next();
      } else {
        next(new HttpException(401, 'Wrong authentication token'));
      }
    } else {
      next(new HttpException(401, 'Authentication token missing'));
    }
  } catch (error) {
    console.error("JWT Verification Error:", error.name, error.message);
    next(new HttpException(401, 'Wrong authentication token'));
  }
};
