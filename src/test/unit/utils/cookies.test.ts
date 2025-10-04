import { TokenData } from "../../../interfaces/auth.interface";
import { createCookie } from "../../../utils/cookies";


describe('createCookie', () => {
  it('devrait créer un cookie correctement formaté', () => {
    const tokenData: TokenData = {
      token: 'abc123',
      expiresIn: 3600,
    };

    const result = createCookie(tokenData);

    expect(result).toBe('Authorization=abc123; HttpOnly; Max-Age=3600;SameSite=None; Secure');
  });

  it('devrait inclure le bon token et la bonne durée', () => {
    const tokenData: TokenData = {
      token: 'myTokenXYZ',
      expiresIn: 7200,
    };

    const result = createCookie(tokenData);

    expect(result).toContain('Authorization=myTokenXYZ');
    expect(result).toContain('Max-Age=7200');
    expect(result).toContain('HttpOnly');
  });
});
