import { NextFunction, Response } from 'express';
import { RequestWithUser } from '../interfaces/auth.interface';
import { HttpException } from '../exceptions/httpException';


export const RefreshTokenMiddleware = (req: RequestWithUser, res: Response, next: NextFunction) => {
    // 1. Cherche le cookie HTTP-Only 'refreshToken'
    const refreshToken:string = req.cookies['refreshToken'];

    if (!refreshToken) {
        // Le cookie est absent, on ne peut pas renouveler
        return next(new HttpException(401, 'Refresh token cookie missing'));
    }

    // 2. Le token est trouvé, on le met sur l'objet requête (ou on l'envoie à un service)
    req.refreshToken = refreshToken; // Nécessite de mettre à jour l'interface Request si vous utilisez TypeScript
    
    next();
};

// Ce middleware sera ensuite appliqué UNIQUEMENT à la route POST /auth/refresh
// La fonction de ce contrôleur lira req.refreshToken, vérifiera la DB, et émettra un nouveau Access Token.