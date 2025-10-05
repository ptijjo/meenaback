import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { CreateUserDto } from '../dtos/users.dto';
import { Routes } from '../interfaces/routes.interface';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { authRateLimiter } from '../middlewares/rateLimit.middleware';

export class AuthRoute implements Routes {
  public path = '/';
  public router = Router();
  public auth = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}signup`, ValidationMiddleware(CreateUserDto), authRateLimiter, this.auth.signUp);
    this.router.post(`${this.path}login`, ValidationMiddleware(CreateUserDto), authRateLimiter, this.auth.logIn);
    this.router.post(`${this.path}logout`, AuthMiddleware, this.auth.logOut);
  }
}
