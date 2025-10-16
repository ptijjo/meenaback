import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithUser } from '../interfaces/auth.interface';
import { AuthService } from '../services/auth.service';
import passport from 'passport';
import { UserService } from '../services/users.service';
import { CreateAuthDto } from '../dtos/auth.dto';
import { ORIGIN } from '../config';
import { HttpException } from '../exceptions/httpException';
import { User } from '../interfaces/users.interface';
import { cacheService } from '../server';

export class AuthController {
  private auth = Container.get(AuthService);
  private user = Container.get(UserService);

  public signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.body;
      const signUpUserData: User = await this.auth.signup(userData);

      res.status(201).json({ data: signUpUserData, message: 'signup' });
    } catch (error) {
      next(error);
    }
  };

  public verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = req.query.token as string;
    const result = await this.auth.verifyEmail(token);
    res.status(200).json(result);
  };

  public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: CreateAuthDto = req.body;
      const ipAddress = String(req.ip || 'unknown');
      const userAgent = String(req.headers['user-agent'] || 'unknown');

      const { cookie, accessToken } = await this.auth.login(userData, ipAddress, userAgent);

      res.setHeader('Set-Cookie', [cookie]);
      res.status(200).json({ data: accessToken, message: 'login' });
    } catch (error) {
      next(error);
    }
  };

  public logOut = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id; // Récupère l'ID via le AuthMiddleware
      // 1. Suppression ciblée dans Redis
      await cacheService.del(`auth:${userId}`);

      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) throw new HttpException(400, 'No refresh token provided');

      await this.auth.logout(refreshToken);

      // Supprimer les cookies
      res.setHeader('Set-Cookie', [
        'Authorization=; Max-age=0; HttpOnly; Secure; SameSite=Strict',
        'refreshToken=; Max-Age=0; HttpOnly; Secure; SameSite=Strict',
      ]);
      res.status(200).json({ message: 'user logout sucessfully' });
    } catch (error) {
      next(error);
    }
  };

  public logOutAll = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.user.id;

      const revoked = await this.auth.logoutAllSessions(id);

      res.setHeader('Set-Cookie', [
        'Authorization=; Max-Age=0; HttpOnly; Secure; SameSite=Strict',
        ,
        'RefreshToken=; Max-Age=0; HttpOnly; Secure; SameSite=Strict',
      ]);

      res.status(200).json({
        message: `All sessions revoked successfully`,
        revokedCount: revoked.revokedCount,
      });
    } catch (error) {
      next(error);
    }
  };

  public whoIsLog = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
     return res.status(401).json({ message: 'Unauthorized: no valid token' });
    }
    const userId = req.user.id;
    const cacheKey = `auth:${userId}`;
    try {
      // 1. Essayer de récupérer le profil complet du cache
      const cachedUser = await cacheService.get(cacheKey);

      if (cachedUser) {
       return res.status(200).json(cachedUser); // Cache Hit : Retour immédiat
      }

      // 2. Cache Miss : Aller chercher dans la DB
      const user: User = await this.user.findUserById(req.user.id);

      if (user) {
        // 3. Mettre à jour le cache et retourner
        await cacheService.set(cacheKey, user, 3600);
       return res.status(200).json(user);
      }

      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    } catch (error) {
      next(error);
    }
  };

  public refreshToken = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const oldRefreshToken = req.cookies.refreshToken;
      if (!oldRefreshToken) {
        res.sendStatus(401);
      }

      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent') || 'Unknown';

      // 🧠 Appel au service
      const { cookie, accessToken } = await this.auth.refreshToken(oldRefreshToken, ipAddress, userAgent);

      // 🍪 Nouveau cookie avec le refresh token
      res.setHeader('Set-Cookie', [cookie]);

      // 📤 Renvoi du nouvel access token (le front Redux va le stocker)
      res.status(200).json({ accessToken });
    } catch (error) {
      console.error('Erreur refresh :', error);
      // Si c'est une HttpException, utiliser son statut, sinon 401
      const status = error instanceof HttpException ? error.status : 401;
      res.sendStatus(status); // Utilisez 401 si le token est rejeté
    }
  };

  /** --------------------------------OAUTH--------------------------------------------------- */

  public homeOauth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.redirect('/auth/google');
  };

  // 🚀 Étape 1 : Redirection vers Google
  public googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

  // 🚀 Étape 2 : Callback de Google
  public googleAuthCallback = (req: RequestWithUser, res: Response, next: NextFunction) => {
    passport.authenticate('google', (err: any, user: any, info: any) => {
      if (err || !user) {
        return res.redirect(ORIGIN); // rediriger en cas d'échec
      }

      req.logIn(user, async (err: any) => {
        if (err) {
          return next(err);
        }

        try {
          const email = user.emails?.[0]?.value;
          const googleId = user.id;
          const ipAddress = String(req.ip || 'unknown');
          const userAgent = String(req.headers['user-agent'] || 'unknown');

          const authData: CreateAuthDto = { email, googleId };

          // 🔥 Utilisation de ton service d’auth
          const { cookie, accessToken } = await this.auth.login(authData, ipAddress, userAgent);

          // ✅ Ajout des cookies manquants

          res.setHeader('Set-Cookie', cookie);

          // ✅ Réponse 200 avec les données nécessaires au front-end
          const finalRedirectUrl = `${ORIGIN}/auth/callback#access_token=${accessToken}`;
          return res.redirect(finalRedirectUrl);
        } catch (error) {
          console.error('Erreur dans googleAuthCallback:', error);
          return res.status(401).json({ error: 'Échec de la création de session' });
        }
      });
    })(req, res, next);
  };

  // 🚀 Étape 3 : Contrôle du profil (optionnel)
  public controlProfil = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Renvoyer l'objet en partie
    const googleUser = req.user as any;
    const user = {
      id: googleUser.id,
      email: googleUser.emails?.[0]?.value, // si tu récupères les emails avec le scope
      avatar: googleUser.photos?.[0]?.value, // si disponible
    };

    // On va rechercher l'utilisateur dans la base
    const existingUser = await this.user.user.findUnique({ where: { googleId: user.id } });

    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      id: existingUser.id,
      email: existingUser.email,
      secretName: existingUser.secretName,
      avatar: user.avatar,
    });
  };
}
