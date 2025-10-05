import { PrismaClient, User } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { Service } from 'typedi';
import { CreateUserDto } from '../dtos/users.dto';
import { createToken } from '../utils/tokens';
import { createCookie } from '../utils/cookies';
import { HttpException } from '../exceptions/httpException';

@Service()
export class AuthService {
  public users = new PrismaClient().user;
  public prisma = new PrismaClient();

  public async signup(userData: CreateUserDto): Promise<User> {
    const findUser: User = await this.users.findUnique({ where: { email: userData.email } });
    if (findUser) throw new HttpException(409, `This email ${userData.email} already exists`);

    const hashedPassword = await hash(userData.password, 10);
    const createUserData: Promise<User> = this.users.create({ data: { ...userData, password: hashedPassword } });

    return createUserData;
  }

  public async login(userData: { email: string; password: string, ipAdress: string,userAgent:string }): Promise<{ cookie: string; findUser: User }> {
    const findUser: User | null = await this.users.findUnique({ where: { email: userData.email } });
    if (!findUser) throw new HttpException(401, 'Identifiants incorrects');

    // Vérifier si le compte est verrouillé
    if (findUser.lockedUntil && findUser.lockedUntil > new Date()) {
      throw new HttpException(403, 'Compte temporairement verrouillé');
    }

    const isPasswordMatching: boolean = await compare(userData.password, findUser.password);
    const success = isPasswordMatching;

    // Enregistrer tentative de connexion
    await this.prisma.loginAttempts.create({
      data: {
        email: { connect: { email: findUser.email } },
        success,
        ipAddress: ipAdress,
      },
    });

    if (!success) {
      let failed = findUser.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;

      if (failed >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // verrouillage 15 min
        failed = 0;
      }

      await this.prisma.user.update({
        where: { email: userData.email },
        data: { failedLoginAttempts: failed, lockedUntil },
      });

      throw new HttpException(401, 'Mot de passe incorrect');
    }

    // Reset des échecs si login réussi
    await this.prisma.user.update({
      where: { email: userData.email },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    // Générer tokens
    const tokenData = createToken(findUser);
    const cookie = createCookie(tokenData);

    // Stocker refresh token en DB
    await this.prisma.refreshToken.create({
      data: {
        userId: findUser.id,
        tokenHash: tokenData.token, // idéalement hashé
        userAgent: userAgent,
        ipAdress: ipAdress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { cookie, findUser };
  }

  public async logout(userData: User): Promise<User> {
    const findUser: User = await this.users.findFirst({ where: { email: userData.email, password: userData.password } });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    return findUser;
  }
}
