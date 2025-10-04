import { PrismaClient, User } from '@prisma/client';
import { hash } from 'bcrypt';
import { CreateUserDto } from '../../../dtos/users.dto';
import { HttpException } from '../../../exceptions/httpException';
import { UserService } from '../../../services/users.service';

// ----- Mock Prisma -----
jest.mock('@prisma/client', () => {
  const mUser = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => ({ user: mUser })),
  };
});

// ----- Mock bcrypt -----
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UserService', () => {
  let userService: UserService;
  let prismaUserMock: any;

  const mockUser: User = {
    id: '1',
    email: 'test@test.com',
    password: 'hashedpass',
    secretName: 'secret',
  };

  beforeEach(() => {
    userService = new UserService();
    prismaUserMock = (userService as any).user;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllUser', () => {
    it('should return all users', async () => {
      prismaUserMock.findMany.mockResolvedValue([mockUser]);
      const users = await userService.findAllUser();
      expect(users).toEqual([mockUser]);
      expect(prismaUserMock.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findUserById', () => {
    it('should return user if found', async () => {
      prismaUserMock.findUnique.mockResolvedValue(mockUser);
      const user = await userService.findUserById('1');
      expect(user).toEqual(mockUser);
    });

    it('should throw if user not found', async () => {
      prismaUserMock.findUnique.mockResolvedValue(null);
      await expect(userService.findUserById('1')).rejects.toThrow(HttpException);
    });
  });

  describe('updateUser', () => {
    const updateDto: CreateUserDto = { email: 'new@test.com', password: '123', secretName: 'secret' };

    it('should update and return user', async () => {
      prismaUserMock.findUnique.mockResolvedValue(mockUser);
      (hash as jest.Mock).mockResolvedValue('hashedpassword');
      prismaUserMock.update.mockResolvedValue({ ...mockUser, ...updateDto, password: 'hashedpassword' });

      const updatedUser = await userService.updateUser('1', updateDto);

      expect(updatedUser).toEqual({ ...mockUser, ...updateDto, password: 'hashedpassword' });
      expect(hash).toHaveBeenCalledWith(updateDto.password, 10);
      expect(prismaUserMock.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { ...updateDto, password: 'hashedpassword' },
      });
    });

    it('should throw if user not found', async () => {
      prismaUserMock.findUnique.mockResolvedValue(null);
      await expect(userService.updateUser('1', updateDto)).rejects.toThrow(HttpException);
    });
  });

  describe('deleteUser', () => {
    it('should delete and return user', async () => {
      prismaUserMock.findUnique.mockResolvedValue(mockUser);
      prismaUserMock.delete.mockResolvedValue(mockUser);

      const deletedUser = await userService.deleteUser('1');
      expect(deletedUser).toEqual(mockUser);
      expect(prismaUserMock.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw if user not found', async () => {
      prismaUserMock.findUnique.mockResolvedValue(null);
      await expect(userService.deleteUser('1')).rejects.toThrow(HttpException);
    });
  });
});
