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
    /**
     * @swagger
     * /signup:
     *   post:
     *     tags: [Auth]
     *     summary: Register a new user
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *               password:
     *                 type: string
     *     responses:
     *       201:
     *         description: User created successfully
     *       400:
     *         description: Bad request
     */
    this.router.post(`/signup`, ValidationMiddleware(CreateUserDto), authRateLimiter, this.auth.signUp);
    
    /**
     * @swagger
     * /verify-email/{token}:
     *   get:
     *     tags: [Auth]
     *     summary: Verify user email
     *     parameters:
     *       - in: path
     *         name: token
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Email verified successfully
     */
    this.router.get(`/verify-email/:token`, this.auth.verifyEmail);
    
    /**
     * @swagger
     * /login:
     *   post:
     *     tags: [Auth]
     *     summary: User login
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *               password:
     *                 type: string
     *     responses:
     *       200:
     *         description: Login successful
     *       401:
     *         description: Unauthorized
     */
    this.router.post(`/login`, ValidationMiddleware(CreateAuthDto), authRateLimiter, this.auth.logIn);
    
    /**
     * @swagger
     * /login2fa:
     *   post:
     *     tags: [Auth]
     *     summary: Two-factor authentication login
     *     responses:
     *       200:
     *         description: 2FA code sent
     */
    this.router.post(`/login2fa`, this.auth.login2FA);
    
    /**
     * @swagger
     * /2fa:
     *   post:
     *     tags: [Auth]
     *     summary: Verify 2FA code
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: 2FA verified
     */
    this.router.post(`/2fa`, AuthMiddleware, this.auth.verify2FA);
    
    /**
     * @swagger
     * /logout:
     *   get:
     *     tags: [Auth]
     *     summary: Logout user
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Logout successful
     */
    this.router.get(`/logout`,AuthMiddleware,AuthSecretMiddleware, this.auth.logOut);
    
    /**
     * @swagger
     * /logoutAll:
     *   get:
     *     tags: [Auth]
     *     summary: Logout from all devices
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Logged out from all devices
     */
    this.router.get(`/logoutAll`, AuthMiddleware, this.auth.logOutAll);
    
    /**
     * @swagger
     * /connected:
     *   get:
     *     tags: [Auth]
     *     summary: Get current logged user
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Current user info
     */
    this.router.get(`/connected`, AuthMiddleware,AuthSecretMiddleware, this.auth.whoIsLog);
    
    /**
     * @swagger
     * /refresh:
     *   post:
     *     tags: [Auth]
     *     summary: Refresh access token
     *     responses:
     *       200:
     *         description: Token refreshed
     */
    this.router.post(`/refresh`, RefreshTokenMiddleware, this.auth.refreshToken);
    
    /**
     * @swagger
     * /desactivateAccount:
     *   post:
     *     tags: [Auth]
     *     summary: Deactivate user account
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Account deactivated
     */
    this.router.post(`/desactivateAccount`, AuthMiddleware, this.auth.desactivateAccount);
    
    /**
     * @swagger
     * /recuperationAccount:
     *   post:
     *     tags: [Auth]
     *     summary: Recover deactivated account
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Account recovered
     */
    this.router.post(`/recuperationAccount`, AuthMiddleware, this.auth.recuperationAccount);
    
  
    //***--------------------------------------oauth Googole---------------------------------------------------***
    this.router.get(`/`, this.auth.homeOauth);
    this.router.get(`/auth/google`, this.auth.googleAuth);
    this.router.get(`/auth/google/callback`, this.auth.googleAuthCallback);
    this.router.get(`/profile`, this.auth.controlProfil);
  }
}
