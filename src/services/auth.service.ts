import { PrismaClient, User } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { Service } from 'typedi';
import { CreateUserDto } from '../dtos/users.dto';
import { createAccessToken, createRefreshToken } from '../utils/tokens';
import { createCookie } from '../utils/cookies';
import { HttpException } from '../exceptions/httpException';
import { CreateAuthDto } from '../dtos/auth.dto';
import { MAX_ACTIVE_SESSIONS, REFRESH_TOKEN_SECRET } from '../config';
import { UserSecret } from '../interfaces/userSecret.interface';
import { verify } from 'jsonwebtoken';

@Service()
export class AuthService {
  public users = new PrismaClient().user;
  public prisma = new PrismaClient();

  public async signup(userData: CreateUserDto): Promise<User> {
    const findUser: User = await this.users.findUnique({ where: { email: userData.email } });
    if (findUser) throw new HttpException(409, `This email ${userData.email} already exists`);

    const hashedPassword = await hash(userData.password, 10);
    const createUserData: User = await this.users.create({ data: { ...userData, password: hashedPassword } });

    await this.prisma.userSecret.create({
      data: {
        name: createUserData.secretName,
        user: { connect: { id: createUserData.id } },
      },
    });

    return createUserData;
  }

  public async login(
    userData: CreateAuthDto,
    ipAddressData: string,
    userAgentData: string,
  ): Promise<{ cookie: string; findUser: User; accessToken: string }> {
    // 1️⃣ Vérifier si l'utilisateur existe
    const findUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (!findUser) throw new HttpException(401, 'Identifiants incorrects');

    // 2️⃣ Vérifier si le compte est temporairement verrouillé
    if (findUser.lockedUntil && findUser.lockedUntil > new Date()) {
      throw new HttpException(403, 'Compte temporairement verrouillé');
    }

    // 3️⃣ Vérifier le mot de passe
    const isPasswordMatching = await compare(userData.password, findUser.password);
    const success = isPasswordMatching;

    // 4️⃣ Enregistrer la tentative de connexion
    await this.prisma.loginAttempts.create({
      data: {
        ipAddress: ipAddressData,
        email: { connect: { email: findUser.email } },
        success,
      },
    });

    // 5️⃣ Gestion des échecs
    if (!success) {
      let failed = findUser.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;

      if (failed >= 5) {
        lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // verrouillage 30 min
        failed = 0;
      }

      await this.prisma.user.update({
        where: { email: findUser.email },
        data: { failedLoginAttempts: failed, lockedUntil },
      });

      throw new HttpException(401, 'Mot de passe incorrect');
    }

    // 6️⃣ Réinitialiser les échecs
    await this.prisma.user.update({
      where: { email: findUser.email },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    // 7️⃣ Vérifier une session existante (même IP + User-Agent)
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

    // 8️⃣ Si session existante → on la renouvelle, sinon on en crée une nouvelle
    let refreshTokenData;
    if (existingSession) {
      // Renouvelle le refresh token
      refreshTokenData = createRefreshToken(findUser);
      const refreshHash = await hash(refreshTokenData.token, 10);

      await this.prisma.session.update({
        where: { id: existingSession.id },
        data: {
          refreshToken: refreshHash,
          jti: refreshTokenData.jti,
          expiresAt: new Date(Date.now() + refreshTokenData.expiresIn * 1000),
        },
      });
    } else {
      // Vérifie le nombre de sessions actives
      const activeSessionsCount = await this.prisma.session.count({
        where: {
          userId: findUser.id,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (activeSessionsCount >= Number(MAX_ACTIVE_SESSIONS)) {
        throw new HttpException(
          403,
          `La limite de ${MAX_ACTIVE_SESSIONS} sessions actives est atteinte. Veuillez en fermer une avant de vous reconnecter.`,
        );
      }

      // Crée une nouvelle session
      refreshTokenData = createRefreshToken(findUser);
      const refreshHash = await hash(refreshTokenData.token, 10);

      await this.prisma.session.create({
        data: {
          user: { connect: { id: findUser.id } },
          refreshToken: refreshHash,
          jti: refreshTokenData.jti,
          userAgent: userAgentData,
          ipAddress: ipAddressData,
          expiresAt: new Date(Date.now() + refreshTokenData.expiresIn * 1000),
        },
      });
    }

    // 9️⃣ Révoquer les sessions expirées
    await this.prisma.session.updateMany({
      where: { expiresAt: { lt: new Date() }, isRevoked: false },
      data: { isRevoked: true },
    });

    // 🔟 Créer un Access Token pour l'utilisateur
    const accessTokenData = createAccessToken(findUser);

    // 1️⃣1️⃣ Créer un cookie HTTPOnly avec le Refresh Token
    const cookie = createCookie(refreshTokenData);

    // 1️⃣2️⃣ Historiser la connexion
    await this.prisma.loginHistory.create({
      data: { user: { connect: { id: findUser.id } } },
    });

    return { cookie, findUser, accessToken: accessTokenData.token };
  }

  public async refreshToken(oldRefreshToken: string, ipAddress: string, userAgent: string): Promise<{ cookie: string; accessToken: string }> {
    let decoded: any;
    try {
      decoded = verify(oldRefreshToken, REFRESH_TOKEN_SECRET);
    } catch (err) {
      throw new HttpException(401, 'Refresh token invalide');
    }

    const { id: userId, jti } = decoded;

    // 1️⃣ Rechercher la session via la JTI (et user)
    const session = await this.prisma.session.findUnique({
      where: { jti },
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

    // 3️⃣ Comparer le token reçu avec le hash stocké
    const isMatch = await compare(oldRefreshToken, session.refreshToken);
    if (!isMatch) {
      throw new HttpException(401, 'Refresh token non reconnu');
    }

    const user = session.user;

    // 4️⃣ Générer un NOUVEAU access token + refresh token
    const newAccessTokenData = createAccessToken(user);
    const newRefreshTokenData = createRefreshToken(user);
    const newRefreshHash = await hash(newRefreshTokenData.token, 10);

    // 5️⃣ Mettre à jour la session avec le NOUVEAU refresh token
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshHash,
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
  public async logout(idData: string): Promise<User> {
    const findUser: User = await this.users.findFirst({ where: { id: idData } });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    return findUser;
  }
}
