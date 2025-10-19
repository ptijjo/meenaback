import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import prisma from '../utils/prisma';
import { Service } from 'typedi';

@Service()
export class TwoFactorService {
  /**
   * Étape 1 — Génère une clé secrète + QR Code
   */
  public async generateSecret(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Utilisateur non trouvé');

    const secret = speakeasy.generateSecret({
      name: `Meena (${user.email})`, // nom affiché dans Google Authenticator
      length: 20,
    });

    // Stocke le secret (en base32) dans la DB
    await prisma.user.update({
      where: { id: userId },
      data: { twoFaSecret: secret.base32 },
    });

    // Génère un QR Code (sous forme de data URL)
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      qrCodeUrl, // image à afficher côté front
      secret: secret.base32, // utile uniquement pour debug 
    };
  }

  /**
   * Étape 2 — Vérifie le code TOTP saisi par l’utilisateur
   */
  public async verifyCode(userId: string, code: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFaSecret) throw new Error('2FA non configuré pour cet utilisateur');

    const verified = speakeasy.totp.verify({
      secret: user.twoFaSecret,
      encoding: 'base32',
      token:code,
      window: 1, 
    });

    if (!verified) throw new Error('Code TOTP invalide');

    // Si le code est valide, on active le 2FA
    await prisma.user.update({
      where: { id: userId },
      data: { is2FaEnable: true },
    });

    return true;
  }

  public async verifyLoginCode(userId: string, code: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFaSecret) throw new Error('2FA non configuré pour cet utilisateur');

    const verified = speakeasy.totp.verify({
      secret: user.twoFaSecret,
      encoding: 'base32',
      token:code,
      window: 1, 
    });

    if (!verified) throw new Error('Code TOTP invalide');

    return user
  }
}
