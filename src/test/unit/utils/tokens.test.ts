import * as jwt from 'jsonwebtoken';
import { User } from '../../../interfaces/users.interface';
import { DataStoredInToken, TokenData } from '../../../interfaces/auth.interface';
import { EXPIRES_IN, SECRET_KEY } from '../../../config';
import { createToken } from '../../../utils/tokens';

// On mock tout le module jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mocked-token'),
}));

describe("creation des tokens de l'application", () => {
  it("devrait crée un token a partir d'un utilisateur", () => {
    const user: User = { id: '1', email: 'test@test.com', password: '123', secretName: 'acv' };

     const token = createToken(user);  // <- on teste la fonction exportée

    expect(token).toEqual({
      expiresIn:EXPIRES_IN,
      token: 'mocked-token',
    });
     expect(jwt.sign).toHaveBeenCalledWith({ id: '1' }, SECRET_KEY, { expiresIn: EXPIRES_IN });
  });
});
