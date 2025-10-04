import { AuthMiddleware } from '../../../middlewares/auth.middleware';
import { PrismaClient } from '@prisma/client';
import { verify } from 'jsonwebtoken';
import { HttpException } from '../../../exceptions/httpException';

jest.mock('@prisma/client');
jest.mock('jsonwebtoken');

describe('AuthMiddleware', () => {
  let mockUser: any;
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    mockUser = { id: '1', email: 'test@test.com' };
    req = {
      cookies: {},
      header: jest.fn(),
    };
    res = {} as any;
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call next with user when token is valid', async () => {
    req.cookies['Authorization'] = 'valid-token';

    (verify as jest.Mock).mockReturnValue({ id: '1' });
    const userMock = { findUnique: jest.fn().mockResolvedValue(mockUser) };
    (PrismaClient as jest.Mock).mockImplementation(() => ({ user: userMock }));

    await AuthMiddleware(req, res, next);

    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalledWith();
    expect(userMock.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('should call next with HttpException(401) if token is invalid', async () => {
    req.cookies['Authorization'] = 'invalid-token';
    (verify as jest.Mock).mockImplementation(() => { throw new Error('fail'); });

    await AuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(HttpException));
    expect((next.mock.calls[0][0] as HttpException).status).toBe(401);
  });

  it('should call next with HttpException(404) if token missing', async () => {
    await AuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(HttpException));
    expect((next.mock.calls[0][0] as HttpException).status).toBe(404);
  });

  it('should call next with HttpException(401) if user not found', async () => {
    req.cookies['Authorization'] = 'valid-token';
    (verify as jest.Mock).mockReturnValue({ id: '1' });
    const userMock = { findUnique: jest.fn().mockResolvedValue(null) };
    (PrismaClient as jest.Mock).mockImplementation(() => ({ user: userMock }));

    await AuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(HttpException));
    expect((next.mock.calls[0][0] as HttpException).status).toBe(401);
  });
});
