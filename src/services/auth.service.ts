import { User } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import Container, { Service } from 'typedi';
import { CreateUserDto } from '../dtos/users.dto';
import { createAccessToken, createRefreshToken, RefreshTokenData } from '../utils/tokens';
import { createCookie } from '../utils/cookies';
import { HttpException } from '../exceptions/httpException';
import { CreateAuthDto } from '../dtos/auth.dto';
import {
  EXPIRES_TOKEN_VERIFICATION_EMAIL,
  MAX_ACTIVE_SESSIONS,
  NUMBER_OF_FAIL_BEFORE_LOCK,
  REFRESH_TOKEN_SECRET,
  TIME_LOCK,
  TWO_FA_SECRET_KEY,
  VERIFICATION_EMAIL_LINK,
} from '../config';
import { sign, verify } from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { MailService } from './mails.service';
import prisma from '../utils/prisma';
import { generateId } from '../utils/generateId';
import { TwoFactorService } from './twofactor.service';
import { cacheService } from '../server';


@Service()
export class AuthService {
  public users = prisma.user;
  public prisma = prisma;
  public mailService = Container.get(MailService);
  public doubleFa = Container.get(TwoFactorService);

  public async signup(userData: CreateUserDto): Promise<User> {
    // 1️⃣ Vérifie si l'utilisateur existe déjà
    const findUser: User = await this.users.findUnique({ where: { email: userData.email } });
    if (findUser) throw new HttpException(409, `This email ${userData.email} already exists`);

    // 2️⃣ Hasher le mot de passe
    const hashedPassword = await hash(userData.password, 10);

    // 3️⃣ Générer un token de vérification unique
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpiresAt = new Date(Date.now() + Number(EXPIRES_TOKEN_VERIFICATION_EMAIL)); // 48h

    // 4️⃣ Créer l'utilisateur non vérifié
    const createUserData: User = await this.users.create({
      data: {
        ...userData,
        password: hashedPassword,
        isVerified: false,
        verificationToken,
        verificationExpiresAt,
      },
    });

    // 5️⃣ Créer le secret associé
    await this.prisma.userSecret.create({
      data: {
        nameSecret: createUserData.name,
        avatarSecret:createUserData.avatar,
        user: { connect: { id: createUserData.id } },
        ID: generateId(9),
      },
    });

    // 6️⃣ Envoi de l'email de vérification (mock pour le moment)

    const verificationLink = `${VERIFICATION_EMAIL_LINK}${verificationToken}`;
    console.log(`📧 Lien de vérification envoyé à ${createUserData.email} : ${verificationLink}`);

    await this.mailService.sendEmailVerification(createUserData.email, verificationLink);

    return createUserData;
  }

  public async verifyEmail(token: string): Promise<User> {
    // 1️⃣ Trouver l'utilisateur avec ce token
    const user = await this.prisma.user.findFirst({ where: { verificationToken: token,desactivateAccountDate:null } });

    if (!user) throw new HttpException(400, 'Lien de vérification invalide');
    if (user.isVerified) throw new HttpException(400, 'Ce compte est déjà vérifié');
    if (user.verificationExpiresAt && user.verificationExpiresAt < new Date()) {
      // Supprimer le compte expiré
      await this.prisma.user.delete({ where: { id: user.id } });
      throw new HttpException(410, 'Le lien a expiré, veuillez vous réinscrire');
    }

    // 2️⃣ Activer le compte
    const verifiedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationExpiresAt: null,
      },
    });

    return verifiedUser;
  }

  private async finalizeLogin(user: User, ipAddress: string, userAgent: string): Promise<{ cookie: string; findUser: User; accessToken: string }> {
    // 1️⃣ Vérifier une session existante
    const existingSession = await this.prisma.session.findFirst({
      where: {
        userId: user.id,
        ipAddress,
        userAgent,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2️⃣ Créer ou renouveler la session
    let refreshTokenData;
    if (existingSession) {
      refreshTokenData = createRefreshToken(user);
      await this.prisma.session.update({
        where: { id: existingSession.id },
        data: {
          jti: refreshTokenData.jti,
          expiresAt: new Date(Date.now() + refreshTokenData.expiresIn * 1000),
        },
      });
    } else {
      // Vérifie le nombre de sessions actives
      const activeSessionsCount = await this.prisma.session.count({
        where: {
          userId: user.id,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (activeSessionsCount >= Number(MAX_ACTIVE_SESSIONS)) {
        throw new HttpException(403, `La limite de ${MAX_ACTIVE_SESSIONS} sessions actives est atteinte.`);
      }

      // Crée une nouvelle session
      refreshTokenData = createRefreshToken(user);

      await this.prisma.session.create({
        data: {
          user: { connect: { id: user.id } },
          jti: refreshTokenData.jti,
          userAgent,
          ipAddress,
          expiresAt: new Date(Date.now() + refreshTokenData.expiresIn * 1000),
        },
      });
    }

    // 3️⃣ Révoquer les sessions expirées
    await this.prisma.session.updateMany({
      where: { expiresAt: { lt: new Date() }, isRevoked: false },
      data: { isRevoked: true },
    });

    // 4️⃣ Créer tokens + cookie
    const accessTokenData = createAccessToken(user);
    const cookie = createCookie(refreshTokenData);

    // 5️⃣ Historiser la connexion
    await this.prisma.loginHistory.create({
      data: { user: { connect: { id: user.id } } },
    });

    return { cookie, findUser: user, accessToken: accessTokenData.token };
  }

  public async login(
    userData: CreateAuthDto,
    ipAddressData: string,
    userAgentData: string,
  ): Promise<{ cookie: string; findUser: User; accessToken: string; code?: string }> {

    //GoogleId present
    if (userData.googleId) {
      let findUser: User = await this.users.findUnique({ where: { googleId: userData.googleId,desactivateAccountDate:null } });

      // Vérifier s'il existe déjà un utilisateur avec le même email
      const existingByEmail = await this.users.findUnique({ where: { email: userData.email,desactivateAccountDate:null } });

      if (existingByEmail) {
        // On associe le googleId au compte existant
        findUser = await this.prisma.user.update({
          where: { id: existingByEmail.id ,desactivateAccountDate:null},
          data: { googleId: userData.googleId },
        });
      }

      // Si pas d'utilisateur → on le crée à la volée
      if (!findUser) {
        //on cré un user dans la bdd avec l'email + googleId et le le connecte
        findUser = await this.prisma.user.create({
          data: {
            email: userData.email,
            googleId: userData.googleId,
            name: `user` + generateId(7),
            isVerified: true,
            status:"onLine",
          },
        });

        await this.prisma.userSecret.create({
          data: {
            nameSecret: findUser.name,
            avatarSecret:findUser.avatar,
            user: { connect: { id: findUser.id } },
            ID: generateId(9),
          },
        });
      }

      // Vérifier une session existante (même IP + User-Agent)
      const existingSession = await this.prisma.session.findFirst({
        where: {
          userId: findUser.id,
          ipAddress: ipAddressData,
          userAgent: userAgentData,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      // refreshTokenData sera défini dans les deux cas
      let refreshTokenData: RefreshTokenData;
      if (existingSession) {
        // Renouveler : créer un nouveau refresh token (JWT avec jti)
        refreshTokenData = createRefreshToken(findUser);

        await this.prisma.session.update({
          where: { id: existingSession.id },
          data: {
            jti: refreshTokenData.jti,
            expiresAt: new Date(Date.now() + refreshTokenData.expiresIn * 1000),
          },
        });
      } else {
        // Vérifier le nombre de sessions actives
        const activeSessionsCount = await this.prisma.session.count({
          where: { userId: findUser.id, isRevoked: false, expiresAt: { gt: new Date() } },
        });

        if (activeSessionsCount >= Number(MAX_ACTIVE_SESSIONS)) {
          throw new HttpException(
            403,
            `La limite de ${MAX_ACTIVE_SESSIONS} sessions actives est atteinte. Veuillez en fermer une avant de vous reconnecter.`,
          );
        }

        // Créer une nouvelle session (avec jti)
        refreshTokenData = createRefreshToken(findUser);

        await this.prisma.session.create({
          data: {
            user: { connect: { id: findUser.id } },
            jti: refreshTokenData.jti,
            userAgent: userAgentData,
            ipAddress: ipAddressData,
            expiresAt: new Date(Date.now() + refreshTokenData.expiresIn * 1000),
          },
        });
      }

      // Révoquer les sessions expirées
      await this.prisma.session.updateMany({
        where: { expiresAt: { lt: new Date() }, isRevoked: false },
        data: { isRevoked: true },
      });

      // Générer l'access token (une seule fois)
      const accessTokenData = createAccessToken(findUser);

      // Créer le cookie HTTPOnly (avec le refresh token JWT)
      const cookie = createCookie(refreshTokenData);

      // Historiser la connexion (une seule fois)
      await this.prisma.loginHistory.create({
        data: { user: { connect: { id: findUser.id } } },
      });

      return { cookie, findUser, accessToken: accessTokenData.token };
    }

    // 1️⃣ Vérifier si l'utilisateur existe
    const findUser = await this.prisma.user.findUnique({
      where: { email: userData.email, desactivateAccountDate: null },
    });
    if (!findUser) throw new HttpException(401, 'Identifiants incorrects');

    //si il n'a pas encore vérifier son adresse mail il ne pourra pas se connecter
    if (!findUser.isVerified) {
      throw new HttpException(403, 'Merci de vérifier votre email avant de vous connecter');
    }

    // 2️⃣ Vérifier si le compte est temporairement verrouillé
    if (findUser.lockedUntil && findUser.lockedUntil > new Date()) {
      throw new HttpException(403, `Compte temporairement verrouillé jusqu'à ${findUser.lockedUntil}`);
    }

    // 3️⃣ Vérifier le mot de passe
    const isPasswordMatching = await compare(userData.password, findUser.password);
    const success = isPasswordMatching;

    // 5️⃣ Gestion des échecs
    if (!success) {
      await this.prisma.loginAttempts.create({
        data: {
          ipAddress: ipAddressData,
          email: { connect: { email: findUser.email } },
          success: false,
        },
      });

      let failed = findUser.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;

      if (failed >= Number(NUMBER_OF_FAIL_BEFORE_LOCK)) {
        lockedUntil = new Date(Date.now() + Number(TIME_LOCK)); // verrouillage 30 min
        failed = 0;
      }

      await this.prisma.user.update({
        where: { email: findUser.email },
        data: { failedLoginAttempts: failed, lockedUntil },
      });

      throw new HttpException(401, 'Identifiants incorrects');
    }

    // 6️⃣ Réinitialiser les échecs
    await this.prisma.user.update({
      where: { email: findUser.email },
      data: { failedLoginAttempts: 0, lockedUntil: null,status: "onLine" },
    });

    //si double FA activée
    if (findUser.is2FaEnable) {
      // Créer un token temporaire (JWT 5 min)
      const code = sign({ userId: findUser.id }, TWO_FA_SECRET_KEY, { expiresIn: '5m' });
      return { cookie: '', findUser, accessToken: '', code };
    }

    return await this.finalizeLogin(findUser, ipAddressData, userAgentData);
  }

  public async loginWith2FA(code: string, tempToken: string, ipAddress: string, userAgent: string) {
    const decoded = verify(tempToken, TWO_FA_SECRET_KEY) as { userId: string };
    const userId = decoded.userId;

    const user = await this.doubleFa.verifyLoginCode(userId, code);

    // ✅ Code valide → on termine le login
    return await this.finalizeLogin(user, ipAddress, userAgent);
  }

  public async refreshToken(oldRefreshToken: string, ipAddress: string, userAgent: string): Promise<{ cookie: string; accessToken: string }> {
    let decoded: any;
    try {
      decoded = verify(oldRefreshToken, REFRESH_TOKEN_SECRET);
    } catch (err) {
      throw new HttpException(401, 'Refresh token invalide');
    }

    // 1️⃣ Rechercher la session via la JTI (et user)
    const session = await this.prisma.session.findUnique({
      where: { jti: decoded.jti },
      include: { user: true },
    });

    if (!session || session.isRevoked) {
      throw new HttpException(401, 'Session invalide ou révoquée');
    }

    // 2️⃣ Vérifier l'expiration
    if (session.expiresAt < new Date()) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });
      throw new HttpException(401, 'Session expirée, veuillez vous reconnecter');
    }

    const user = session.user;

    // 4️⃣ Générer un NOUVEAU access token + refresh token
    const newAccessTokenData = createAccessToken(user);
    const newRefreshTokenData = createRefreshToken(user);

    // 5️⃣ Mettre à jour la session avec le NOUVEAU Jti
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        jti: newRefreshTokenData.jti,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + newRefreshTokenData.expiresIn * 1000),
      },
    });

    // 6️⃣ Créer un cookie HTTPOnly avec le nouveau refresh token
    const cookie = createCookie(newRefreshTokenData);

    return {
      cookie,
      accessToken: newAccessTokenData.token,
    };
  }

  public async logout(refreshToken: string): Promise<{ revoked: boolean; id: string }> {
    try {
      // 1️⃣ Vérifier que le token existe
      if (!refreshToken) throw new HttpException(400, 'No refresh token provided');

      // 2️⃣ Vérifier la validité du token
      const decoded = verify(refreshToken, REFRESH_TOKEN_SECRET) as { id: string; jti: string };
      if (!decoded || !decoded.jti) throw new HttpException(400, 'Invalid token');

      // 3️⃣ Trouver la session correspondante
      const session = await this.prisma.session.findUnique({
        where: { jti: decoded.jti },
      });

      if (!session) throw new HttpException(404, 'Session not found');

      // 4️⃣ Révoquer la session
      await this.prisma.session.update({
        where: { jti: decoded.jti },
        data: { isRevoked: true, revokedAt: new Date() },
      });
      await cacheService.del(`user:${decoded.id}`);
      return { revoked: true, id: decoded.id };
    } catch (error) {
      throw new HttpException(401, 'Invalid or expired refresh token');
    }
  }

  public async logoutAllSessions(userId: string): Promise<{ revokedCount: number }> {
    const findUser = await this.users.findFirst({ where: { id: userId } });
    if (!findUser) throw new HttpException(404, "User doesn't exist");

    // 2️⃣ Révoque toutes les sessions actives (non révoquées)
    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    return { revokedCount: result.count };
  }

  public async desactiveAccount(userId: string): Promise<User> {
    // 1️⃣ Vérifie si l'utilisateur existe déjà
    const findUser: User | null = await this.users.findUnique({ where: { id: userId } });
    if (!findUser) throw new HttpException(409, `Compte introuvable`);

    const desactiveAccount = await this.users.update({
      where: {
        id: findUser.id,
      },
      data: {
        desactivateAccountDate: new Date(Date.now()),
      },
    });

    await this.prisma.session.deleteMany({ where: { userId: desactiveAccount.id } })

    return desactiveAccount;
  }

  public async recuperationAccount(userData: CreateAuthDto, idSecret: string): Promise<User>{
    
    const existAccount = await this.users.findFirst({
      where: {
        email: userData.email, desactivateAccountDate: {
          not: null
        }
      },
      include: {
        UserSecret:true
      }
    });

    if (!existAccount) throw new HttpException(409, "Utilisateur inconnu !");

    if (existAccount.UserSecret.ID !== idSecret) throw new HttpException(409, "Utilisasteur inconnu !")
    
    const activate = await this.users.update({
      where: { id: existAccount.id }, data: {
        desactivateAccountDate: null
      }
    });

    return activate;
    
    
  }
}
