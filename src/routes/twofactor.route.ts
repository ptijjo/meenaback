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
    
    /**
     * @swagger
     * /2fa/setup:
     *   post:
     *     tags: [TwoFactor]
     *     summary: Generate 2FA QR code
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: QR code generated
     */
    this.router.post('/setup', AuthMiddleware, this.controller.generate);
    
    /**
     * @swagger
     * /2fa/verify:
     *   post:
     *     tags: [TwoFactor]
     *     summary: Verify 2FA code and enable 2FA
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               token:
     *                 type: string
     *     responses:
     *       200:
     *         description: 2FA enabled
     */
    this.router.post('/verify', AuthMiddleware, this.controller.verify);
    
    /**
     * @swagger
     * /2fa/desactivate2FA:
     *   patch:
     *     tags: [TwoFactor]
     *     summary: Disable 2FA
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: 2FA disabled
     */
    this.router.patch('/desactivate2FA', AuthMiddleware, this.controller.desactivate2FA);
  }
}
