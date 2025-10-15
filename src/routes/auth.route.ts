import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { CreateUserDto } from '../dtos/users.dto';
import { Routes } from '../interfaces/routes.interface';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { authRateLimiter } from '../middlewares/rateLimit.middleware';
import { CreateAuthDto } from '../dtos/auth.dto';
import { RefreshTokenMiddleware } from '../middlewares/refreshToken.middleware';

export class AuthRoute implements Routes {
  public path = '/';
  public router = Router();
  public auth = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}signup`, ValidationMiddleware(CreateUserDto), authRateLimiter, this.auth.signUp);
    this.router.get(`${this.path}verify-email/:token`, this.auth.verifyEmail);
    this.router.post(`${this.path}login`, ValidationMiddleware(CreateAuthDto), authRateLimiter, this.auth.logIn);
    this.router.get(`${this.path}logout`, AuthMiddleware, this.auth.logOut);
    this.router.get(`${this.path}logoutAll`, AuthMiddleware, this.auth.logOutAll);
    this.router.get(`${this.path}connected`, AuthMiddleware, this.auth.whoIsLog);
    this.router.post(`${this.path}refresh`, RefreshTokenMiddleware, this.auth.refreshToken);
    

    //oauth Googole
    this.router.get(`${this.path}`, this.auth.homeOauth);
    this.router.get(`${this.path}auth/google`, this.auth.googleAuth);
    this.router.get(`${this.path}auth/google/callback`, this.auth.googleAuthCallback);
    this.router.get(`${this.path}profile`, this.auth.controlProfil);
  }
}
