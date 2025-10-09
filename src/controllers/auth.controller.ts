import { User } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithUser } from '../interfaces/auth.interface';
import { AuthService } from '../services/auth.service';
import passport from 'passport';
import { UserService } from '../services/users.service';
import { CreateAuthDto } from '../dtos/auth.dto';
import { ORIGIN } from '../config';

export class AuthController {
  public auth = Container.get(AuthService);
  public user = Container.get(UserService);

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

      const { cookie, findUser } = await this.auth.login(userData, ipAddress, userAgent);

      res.setHeader('Set-Cookie', [cookie]);
      res.status(200).json({ data: findUser, message: 'login' });
    } catch (error) {
      next(error);
    }
  };

  public logOut = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id: string = req.user.id;
      const ipAddress = String(req.ip);
      const userAgent = String(req.headers['user-agent']);

      const logOutUserData = await this.auth.logout(id, ipAddress, userAgent);

      res.setHeader('Set-Cookie', ['Authorization=; Max-age=0; HttpOnly; Secure; SameSite=Strict']);
      res.status(200).json({ data: logOutUserData, message: 'user logout sucessfully' });
    } catch (error) {
      next(error);
    }
  };

  public logOutAll = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.user.id;

      const revoked = await this.auth.logoutAllSessions(id);

      res.setHeader('Set-Cookie', ['Authorization=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict']);

      res.status(200).json({
        message: `All sessions revoked successfully`,
        revokedCount: revoked.revokedCount,
      });
    } catch (error) {
      next(error);
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
          const { cookie, findUser, accessToken } = await this.auth.login(authData, ipAddress, userAgent);

          // ✅ Redirection vers ton frontend avec token ou juste succès
          return res.redirect(ORIGIN + `/dashboard/${accessToken}`);
        } catch (error) {
          console.error('Erreur dans googleAuthCallback:', error);
          return res.redirect(ORIGIN);
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
