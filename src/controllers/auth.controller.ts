import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithUser } from '../interfaces/auth.interface';
import { AuthService } from '../services/auth.service';
import passport from 'passport';
import { UserService } from '../services/users.service';
import { CreateAuthDto } from '../dtos/auth.dto';
import { ORIGIN, REFRESH_TOKEN_SECRET } from '../config';
import { HttpException } from '../exceptions/httpException';
import { User } from '../interfaces/users.interface';
import { verify } from 'jsonwebtoken';
import { createAccessToken, createRefreshToken } from '../utils/tokens';

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

      const { cookie, findUser } = await this.auth.login(userData, ipAddress, userAgent);

      res.setHeader('Set-Cookie', [cookie]);
      res.status(200).json({ data: findUser, message: 'login' });
    } catch (error) {
      next(error);
    }
  };

  public logOut = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.RefreshToken;
      if (!refreshToken) throw new HttpException(400, 'No refresh token provided');

      await this.auth.logout(refreshToken);

      // Supprimer les cookies
      res.setHeader('Set-Cookie', [
        'Authorization=; Max-age=0; HttpOnly; Secure; SameSite=Strict',
        'RefreshToken=; Max-Age=0; HttpOnly; Secure; SameSite=Strict',
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

  public decodeToken = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'Unauthorized: no valid token' });
    }

    const user: User = await this.user.findUserById(req.user.id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  };

  public refreshToken = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies.refreshToken;
      if (!token) res.sendStatus(401); // pas de token → non autorisé

      const payload: any = verify(token, REFRESH_TOKEN_SECRET);

      // 🔹 Récupérer l'utilisateur complet depuis la DB
      const userService = new UserService();
      const user = await userService.findUserById(payload.id);
      if (!user) res.sendStatus(404);

      // Générer tokens
      const accessToken = createAccessToken(user).token;
      const refreshTokenData = createRefreshToken(user);

      // Remettre le refresh token en cookie
      res.cookie('refreshToken', refreshTokenData.token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: refreshTokenData.expiresIn * 1000,
      });
      res.json({ accessToken });
    } catch (error) {
      console.error(error);
      res.sendStatus(403); // token invalide
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
          const { cookie } = await this.auth.login(authData, ipAddress, userAgent);

          // ✅ Ajout des cookies manquants
          // Poser le cookie déjà créé par login()
          res.cookie('Authorization', cookie.split('=')[1]?.split(';')[0], {
            httpOnly: true,
            secure: false, // mettre true en prod si HTTPS
            maxAge: 3600 * 1000 * 24, // 24h
            sameSite: 'lax',
          });

          // ✅ Redirection vers ton frontend avec token ou juste succès
          return res.redirect(ORIGIN + `/dashboard`);
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
