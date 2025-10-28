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
import { TwoFactorService } from '../services/twofactor.service';
import { UserSecret } from '../interfaces/userSecret.interface';
import { UserSecretService } from '../services/userSecret.service';

export class AuthController {
  public auth = Container.get(AuthService);
  public user = Container.get(UserService);
  public userSecret = Container.get(UserSecretService);
  public doubleFa = Container.get(TwoFactorService);

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
    const token = String(req.params.token);
    console.log('token de vérification : ', token);
    const result = await this.auth.verifyEmail(token);
    res.status(200).json(result);
  };

  public logIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: CreateAuthDto = req.body;
      const ipAddress = String(req.ip || 'unknown');
      const userAgent = String(req.headers['user-agent'] || 'unknown');

      const result = await this.auth.login(userData, ipAddress, userAgent);

      // 🔐 Cas : 2FA activé → on attend le code
      if (result.code) {
        return res.status(202).json({
          message: 'Double authentification requise',
          tempToken: result.code,
        });
      }

      res.setHeader('Set-Cookie', [result.cookie]);
      return res.status(200).json({ data: result.accessToken, message: 'login' });
    } catch (error) {
      next(error);
    }
  };

  public login2FA = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ipAddress = String(req.ip || 'unknown');
      const userAgent = String(req.headers['user-agent'] || 'unknown');
      const { code, tempToken } = req.body;
      const result = await this.auth.loginWith2FA(code, tempToken, ipAddress, userAgent);

      res.setHeader('Set-Cookie', [result.cookie]);
      res.status(200).json({ data: result.accessToken, message: 'login' });
    } catch (error) {
      next(error);
    }
  };

  public verify2FA = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code } = req.body;
      const result = await this.doubleFa.verifyCode(req.user.id, code);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public logOut = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) throw new HttpException(400, 'No refresh token provided');

      const { revoked, id } = await this.auth.logout(refreshToken);
      const idSecret = req.userSecret.ID;

      //Suppression ciblée dans Redis
      await cacheService.del(`auth:${id}`);
      await cacheService.del(`auth:${idSecret}`);

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
    try {
      // Vérification de la présence de l'utilisateur authentifié
      if (!req.user?.id || !req.userSecret?.ID) {
        return res.status(401).json({ message: 'Unauthorized: no valid token' });
      }

      const userId = req.user.id;
      const userSecretId = req.userSecret.ID;

      const cacheKeyUser = `auth:${userId}`;
      const cacheKeyUserSecret = `auth:${userSecretId}`;

      // Tentative de lecture du cache
      const [cachedUser, cachedUserSecret] = await Promise.all([cacheService.get(cacheKeyUser), cacheService.get(cacheKeyUserSecret)]);

      // Si tout est déjà en cache → retour immédiat
      if (cachedUser && cachedUserSecret) {
        return res.status(200).json({
          data: { user: cachedUser, userSecret: cachedUserSecret, fromCache: true },
        });
      }

      // Sinon → on va chercher en base ce qui manque
      const [user, userSecret] = await Promise.all([
        cachedUser ? Promise.resolve(cachedUser) : this.user.findUserById(userId),
        cachedUserSecret ? Promise.resolve(cachedUserSecret) : this.userSecret.findUserSecretById(userSecretId),
      ]);

      // On met à jour le cache si besoin
      if (!cachedUser) await cacheService.set(cacheKeyUser, user, 3600);
      if (!cachedUserSecret) await cacheService.set(cacheKeyUserSecret, userSecret, 3600);

      // Réponse finale
      return res.status(200).json({
        data: { user, userSecret, fromCache: false },
      });
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
      res.status(200).json({ data: { accessToken }, message: 'Access token refreshed' });
    } catch (error) {
      console.error('Erreur refresh :', error);
      // Si c'est une HttpException, utiliser son statut, sinon 401
      const status = error instanceof HttpException ? error.status : 401;
      res.sendStatus(status); // Utilisez 401 si le token est rejeté
    }
  };

  public desactivateAccount = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;

      const desactivate = await this.auth.desactiveAccount(userId);

      res.status(200).json({ message: 'Compte désactivé !', data: desactivate });
    } catch (error) {
      next(error);
    }
  };

  public recuperationAccount = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { idSecret } = req.body;
      const userData = req.body;

      const activate = await this.auth.recuperationAccount(userData, idSecret);

      res.status(200).json({ message: 'Votre compte est réactivé !', data: activate });
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

          // 🔥 Utilisation de ton service d'auth
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
      name: existingUser.name,
      avatar: user.avatar,
    });
  };
}
