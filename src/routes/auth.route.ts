import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { CreateUserDto } from '../dtos/users.dto';
import { Routes } from '../interfaces/routes.interface';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { authRateLimiter } from '../middlewares/rateLimit.middleware';
import { CreateAuthDto } from '../dtos/auth.dto';
import { RefreshTokenMiddleware } from '../middlewares/refreshToken.middleware';
import { AuthSecretMiddleware } from '../middlewares/userSecret.middleware';

export class AuthRoute implements Routes {
  public path = '/';
  public router = Router();
  public auth = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`/signup`, ValidationMiddleware(CreateUserDto), authRateLimiter, this.auth.signUp);
    this.router.get(`/verify-email/:token`, this.auth.verifyEmail);
    this.router.post(`/login`, ValidationMiddleware(CreateAuthDto), authRateLimiter, this.auth.logIn);
    this.router.post(`/login2fa`, this.auth.login2FA);
    this.router.post(`/2fa`, AuthMiddleware, this.auth.verify2FA);
    this.router.get(`/logout`,AuthMiddleware,AuthSecretMiddleware, this.auth.logOut);
    this.router.get(`/logoutAll`, AuthMiddleware, this.auth.logOutAll);
    this.router.get(`/connected`, AuthMiddleware,AuthSecretMiddleware, this.auth.whoIsLog);
    this.router.post(`/refresh`, RefreshTokenMiddleware, this.auth.refreshToken);
    this.router.post(`/desactivateAccount`, AuthMiddleware, this.auth.desactivateAccount);
    this.router.post(`/recuperationAccount`, AuthMiddleware, this.auth.recuperationAccount);
    
  
    //***--------------------------------------oauth Googole---------------------------------------------------***
    this.router.get(`/`, this.auth.homeOauth);
    this.router.get(`/auth/google`, this.auth.googleAuth);
    this.router.get(`/auth/google/callback`, this.auth.googleAuthCallback);
    this.router.get(`/profile`, this.auth.controlProfil);
  }
}
