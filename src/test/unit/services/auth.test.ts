import { PrismaClient, User } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { AuthService } from '../../../services/auth.service';
import { HttpException } from '../../../exceptions/httpException';
import { createToken } from '../../../utils/tokens';
import { createCookie } from '../../../utils/cookies';


jest.mock('@prisma/client', () => {
  const mUser = {
    findUnique: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => ({ user: mUser })),
  };
});

jest.mock('bcrypt');
jest.mock('../../../utils/tokens');
jest.mock('../../../utils/cookies');

describe('AuthService', () => {
  let authService: AuthService;
  let prismaUserMock: any;

  beforeEach(() => {
    authService = new AuthService();
    prismaUserMock = (authService as any).users;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should throw if user already exists', async () => {
      prismaUserMock.findUnique.mockResolvedValue({ email: 'test@example.com' });

      await expect(authService.signup({ email: 'test@example.com', password: 'pass',secretName:"popi" }))
        .rejects.toThrow(HttpException);
    });

    it('should create a new user', async () => {
      prismaUserMock.findUnique.mockResolvedValue(null);
      (hash as jest.Mock).mockResolvedValue('hashedpass');
      const newUser = { id: 1, email: 'new@example.com', password: 'hashedpass' };
      prismaUserMock.create.mockResolvedValue(newUser);

      const result = await authService.signup({ email: 'new@example.com', password: 'pass',secretName:"baba" });
      expect(result).toEqual(newUser);
      expect(prismaUserMock.create).toHaveBeenCalledWith({
        data: { email: 'new@example.com', password: 'hashedpass',secretName:"baba" },
      });
    });
  });

  describe('login', () => {
    it('should throw if user not found', async () => {
      prismaUserMock.findUnique.mockResolvedValue(null);

      await expect(authService.login({ email: 'unknown@example.com', password: 'pass', ipAdress:"iop",userAgent:"pmlo" }))
        .rejects.toThrow(HttpException);
    });

    it('should throw if password does not match', async () => {
      prismaUserMock.findUnique.mockResolvedValue({ email: 'test@example.com', password: 'hash' });
      (compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login({ email: 'test@example.com', password: 'wrong',ipAdress:"iop",userAgent:"pmlo" }))
        .rejects.toThrow(HttpException);
    });

    it('should return cookie and user if login succeeds', async () => {
      const user = { email: 'test@example.com', password: 'hash' } as User;
      prismaUserMock.findUnique.mockResolvedValue(user);
      (compare as jest.Mock).mockResolvedValue(true);
      (createToken as jest.Mock).mockReturnValue('token');
      (createCookie as jest.Mock).mockReturnValue('cookie');

      const result = await authService.login({ email: 'test@example.com', password: 'pass',ipAdress:"iop",userAgent:"pmlo" });
      expect(result).toEqual({ cookie: 'cookie', findUser: user });
    });
  });

  describe('logout', () => {
    it('should throw if user not found', async () => {
      prismaUserMock.findFirst.mockResolvedValue(null);

      await expect(authService.logout({ email: 'unknown@example.com', password: 'pass',secretName:"iop" } as User))
        .rejects.toThrow(HttpException);
    });

    it('should return user if logout succeeds', async () => {
      const user = { email: 'test@example.com', password: 'pass',secretName:"iop" } as User;
      prismaUserMock.findFirst.mockResolvedValue(user);

      const result = await authService.logout(user);
      expect(result).toEqual(user);
    });
  });
});
