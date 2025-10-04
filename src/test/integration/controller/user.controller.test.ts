import express, { Application } from 'express';
import request from 'supertest';
import { UserController } from '../../../controllers/users.controller';
import { UserService } from '../../../services/users.service';
import { Container } from 'typedi';
import { User } from '@prisma/client';
import { HttpException } from '../../../exceptions/httpException';

// ----- Mock UserService -----
const mockUserService = {
  findAllUser: jest.fn(),
  findUserById: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
};

// Remplace le service dans typedi
Container.set(UserService, mockUserService);

describe('UserController Integration', () => {
  let app: Application;
  let controller: UserController;

  const mockUser: User = {
    id: '1',
    email: 'test@test.com',
    password: 'hashedpass',
    secretName: 'secret',
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());
    controller = new UserController();

    app.get('/users', controller.getUsers);
    app.get('/users/:id', controller.getUserById);
    app.put('/users/:id', controller.updateUser);
    app.delete('/users/:id', controller.deleteUser);

    // Middleware global pour catcher les exceptions
    app.use((err: any, req: any, res: any, next: any) => {
      res.status(err.status || 500).json({ message: err.message });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /users should return all users', async () => {
    mockUserService.findAllUser.mockResolvedValue([mockUser]);

    const res = await request(app).get('/users');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([mockUser]);
    expect(mockUserService.findAllUser).toHaveBeenCalledTimes(1);
  });

  it('GET /users/:id should return a single user', async () => {
    mockUserService.findUserById.mockResolvedValue(mockUser);

    const res = await request(app).get('/users/1');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mockUser);
    expect(mockUserService.findUserById).toHaveBeenCalledWith('1');
  });

  it('PUT /users/:id should update and return user', async () => {
    const updatedUser = { ...mockUser, email: 'updated@test.com' };
    mockUserService.updateUser.mockResolvedValue(updatedUser);

    const res = await request(app).put('/users/1').send({ email: 'updated@test.com', password: '123', secretName: 'secret' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(updatedUser);
    expect(mockUserService.updateUser).toHaveBeenCalledWith('1', { email: 'updated@test.com', password: '123', secretName: 'secret' });
  });

  it('DELETE /users/:id should delete and return user', async () => {
    mockUserService.deleteUser.mockResolvedValue(mockUser);

    const res = await request(app).delete('/users/1');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mockUser);
    expect(mockUserService.deleteUser).toHaveBeenCalledWith('1');
  });

  it('should return 409 error if user not found', async () => {
    mockUserService.findUserById.mockRejectedValue(new HttpException(409, "User doesn't exist"));

    const res = await request(app).get('/users/2');

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("User doesn't exist");
  });
});
