import express, { json } from 'express';
import request from 'supertest';
import { Container } from 'typedi';
import { AuthController } from '../../../controllers/auth.controller';
import { AuthService } from '../../../services/auth.service';
import { User } from '@prisma/client';
import { RequestWithUser } from '../../../interfaces/auth.interface';

// ----- Mock du service -----
const mockUser: User = {
  id: '1',
  email: 'test@test.com',
  password: '123',
  secretName: 'test',
};

const authServiceMock: Partial<AuthService> = {
  signup: jest.fn().mockResolvedValue(mockUser),
  login: jest.fn().mockResolvedValue({ cookie: 'mock-cookie', findUser: mockUser }),
  logout: jest.fn().mockResolvedValue(mockUser),
};

Container.set(AuthService, authServiceMock as AuthService);

describe('AuthController Integration', () => {
  let app: express.Express;
  let authController: AuthController;

  beforeAll(() => {
    authController = new AuthController();

    app = express();
    app.use(json());

    app.post('/signup', authController.signUp);
    app.post('/login', authController.logIn);

    // Pour logout, on simule un user déjà présent dans req.user
    app.post('/logout', (req, res, next) => {
      const reqWithUser = req as RequestWithUser;
      reqWithUser.user = mockUser;
      authController.logOut(reqWithUser, res, next);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /signup -> should return 201 and user data on successful signup', async () => {
    const res = await request(app).post('/signup').send({
      email: 'test@test.com',
      password: '123',
      secretName: 'test',
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(mockUser);
    expect(res.body.message).toBe('signup');
    expect(authServiceMock.signup).toHaveBeenCalledTimes(1);
  });

  it('POST /login -> should return 200, user data and set cookie on successful login', async () => {
    const res = await request(app).post('/login').send({
      email: 'test@test.com',
      password: '123',
      secretName: 'test',
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mockUser);
    expect(res.body.message).toBe('login');
    expect(res.headers['set-cookie']).toContain('mock-cookie');
    expect(authServiceMock.login).toHaveBeenCalledTimes(1);
  });

  it('POST /logout -> should return 200, user data and clear cookie', async () => {
    const res = await request(app).post('/logout');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mockUser);
    expect(res.body.message).toBe('logout');
    expect(res.headers['set-cookie']).toContain('Authorization=; Max-age=0');
    expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
  });
});
