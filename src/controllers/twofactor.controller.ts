import { RequestWithUser } from '../interfaces/auth.interface';
import { Response, NextFunction } from 'express';
import { TwoFactorService } from '../services/twofactor.service';
import Container from 'typedi';


export class TwoFactorController {
public twoFactorService = Container.get(TwoFactorService);
  /**
   * Route pour générer le QR Code
   */
    
  public generate = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      console.log("🧠 req.user =", req.user);
      console.log("✅ Méthode generate() appelée !");
      const result = await this.twoFactorService.generateSecret(req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Route pour vérifier le code TOTP
   */
  public verify = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const { token } = req.body;
    try {
      const activate = await this.twoFactorService.verifyCode(req.user.id, token);
      res.status(200).json({ message: '2FA activée avec succès',data:activate });
    } catch (error) {
      next(error);
    }
  };

  public desactivate2FA = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;

      const update = await this.twoFactorService.descativate2FA(userId);

      res.status(200).json({message:"Double  FA désactivée",data:update})

    } catch (error) {
      next(error)
    }
  }
}
