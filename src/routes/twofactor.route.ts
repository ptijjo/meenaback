import { Router } from 'express';
import { TwoFactorController } from '../controllers/twofactor.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { Routes } from '../interfaces/routes.interface';

const router = Router();
const controller = new TwoFactorController();

// Étape 2 : validation du code
router.post('/2fa/verify', AuthMiddleware, controller.verify);

export class TwoFaRoute implements Routes {
  public patch = '/2fa';
  public router = Router();
  public controller = new TwoFactorController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Étape 1 : génération du QR code
    this.router.post('/setup', AuthMiddleware, this.controller.generate);
    // Étape 2 : validation du code
    this.router.post('/verify', AuthMiddleware, this.controller.verify);
  }
}
