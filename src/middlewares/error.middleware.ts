import { NextFunction, Request, Response } from 'express';
import { HttpException } from '../exceptions/httpException';
import { logger } from '../utils/logger';
import { NODE_ENV } from '../config';


export const ErrorMiddleware = (error: HttpException, req: Request, res: Response, next: NextFunction) => {
  try {
    const status: number = error.status || 500;
    const isDevelopment = NODE_ENV === 'development';
    
    // En production, masquer les détails d'erreurs sensibles
    let message: string;
    if (status === 500 && !isDevelopment) {
      message = 'Une erreur interne est survenue';
      // Logger les détails complets en interne même en production
      logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${error.message || 'Something went wrong'}, Stack:: ${error.stack || 'No stack trace'}`);
    } else {
      message = error.message || 'Something went wrong';
      logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}${isDevelopment && error.stack ? `, Stack:: ${error.stack}` : ''}`);
    }

    const response: any = { message };
    
    // En développement, ajouter la stack trace pour le debug
    if (isDevelopment && error.stack) {
      response.stack = error.stack;
    }

    res.status(status).json(response);
  } catch (error) {
    next(error);
  }
};
