import { PrismaClient, User } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { Service } from 'typedi';
import { CreateUserDto } from '../dtos/users.dto';
import { createToken } from '../utils/tokens';
import { createCookie } from '../utils/cookies';
import { HttpException } from '../exceptions/httpException';
import { CreateAuthDto } from '../dtos/auth.dto';
import { EXPIRES_SESSION, MAX_ACTIVE_SESSIONS } from '../config';
import { UserSecret } from '../interfaces/userSecret.interface';

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

  public async login(userData: CreateAuthDto, ipAddressData: string, userAgentData: string): Promise<{ cookie: string; findUser: User }> {
    // 1️⃣ Vérifier si l'utilisateur existe
    const findUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (!findUser) throw new HttpException(401, 'Identifiants incorrects');

    // 2️⃣ Vérifier si le compte est temporairement verrouillé
    if (findUser.lockedUntil && findUser.lockedUntil > new Date()) {
      throw new HttpException(403, 'Compte temporairement verrouillé');
    }

    if (!findUser.isVerified) {
      throw new HttpException(403, 'Veuillez vérifier votre email avant de vous connecter.');
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

    // 7️⃣ Générer token et cookie
    const tokenData = createToken(findUser);
    const cookie = createCookie(tokenData);

    // 8️⃣ Hasher le refresh token avant stockage
    const refreshHash = await hash(tokenData.token, 10);

    // 9️⃣ Limiter les sessions actives à 3
    const activeSessions = await this.prisma.session.findMany({
      where: { userId: findUser.id, isRevoked: false },
      orderBy: { createdAt: 'asc' }, // les plus anciennes en premier
      select: { id: true },
    });

    if (activeSessions.length >= Number(MAX_ACTIVE_SESSIONS)) {
      const toRevokeCount = activeSessions.length - (Number(MAX_ACTIVE_SESSIONS) - 1);
      if (toRevokeCount > 0) {
        const idsToRevoke = activeSessions.slice(0, toRevokeCount).map(s => s.id);
        await this.prisma.session.updateMany({
          where: { id: { in: idsToRevoke } },
          data: { isRevoked: true },
        });
      }
    }

    // 🔟 Créer la nouvelle session
    await this.prisma.session.create({
      data: {
        user: { connect: { id: findUser.id } },
        refreshToken: refreshHash,
        userAgent: userAgentData,
        ipAddress: ipAddressData,
        expiresAt: new Date(Date.now() + Number(EXPIRES_SESSION)),
      },
    });

    // 1️⃣1️⃣ Marquer les sessions expirées comme révoquées
    await this.prisma.session.updateMany({
      where: { expiresAt: { lt: new Date() }, isRevoked: false },
      data: { isRevoked: true },
    });

    // 1️⃣2️⃣ Créer un historique de connexion
    await this.prisma.loginHistory.create({
      data: {
        user: { connect: { id: findUser.id } },
      },
    });

    return { cookie, findUser };
  }

  public async refreshToken(oldRefreshToken: string, ipAddress: string, userAgent: string): Promise<{ cookie: string; accessToken: string }> {
    // 1️⃣ Trouver la session correspondante au refresh token (hashé)
    const sessions = await this.prisma.session.findMany({
      where: { isRevoked: false },
      include: { user: true },
    });

    let sessionFound = null;
    for (const s of sessions) {
      if (await compare(oldRefreshToken, s.refreshToken)) {
        sessionFound = s;
        break;
      }
    }

    if (!sessionFound) {
      throw new HttpException(401, 'Refresh token invalide ou révoqué');
    }

    // 2️⃣ Vérifier si la session est expirée
    if (sessionFound.expiresAt < new Date()) {
      // Révoquer la session
      await this.prisma.session.update({
        where: { id: sessionFound.id },
        data: { isRevoked: true },
      });
      throw new HttpException(401, 'Session expirée, veuillez vous reconnecter');
    }

    const user = sessionFound.user;

    // 3️⃣ Générer un nouveau token et cookie
    const tokenData = createToken(user);
    const cookie = createCookie(tokenData);

    // 4️⃣ Hasher le nouveau refresh token
    const newRefreshHash = await hash(tokenData.token, 10);

    // 5️⃣ Mettre à jour la session existante avec le nouveau refresh token et infos
    await this.prisma.session.update({
      where: { id: sessionFound.id },
      data: {
        refreshToken: newRefreshHash,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // prolonger 7 jours
      },
    });

    return { cookie, accessToken: tokenData.token };
  }

  public async logout(idData: string): Promise<User> {
    const findUser: User = await this.users.findFirst({ where: { id: idData } });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    return findUser;
  }
}
