import { Router } from 'express';
import { TwoFactorController } from '../controllers/twofactor.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { Routes } from '../interfaces/routes.interface';

export class TwoFaRoute implements Routes {
  public path = '/2fa';
  public router = Router();
  private controller = new TwoFactorController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log("🚀 Route 2FA initialisée : /2fa/setup et /2fa/verify");
    // Étape 1 : génération du QR code
    this.router.post('/setup', AuthMiddleware, this.controller.generate);
    // Étape 2 : validation du code
    this.router.post('/verify', AuthMiddleware, this.controller.verify);
  }
}
