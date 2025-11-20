describe('createCookie', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules(); // Efface le cache des modules pour chaque test
        process.env = { ...originalEnv }; // Restaure les variables d'environnement
    });

    afterAll(() => {
        process.env = originalEnv; // Restaure les variables d'environnement après tous les tests
    });

    it('should create a cookie string with Secure and SameSite=Lax in production', () => {
        process.env.NODE_ENV = 'production';
        const { createCookie } = require("../../utils/cookies");

        const tokenData = {
            token: 'sample_refresh_token',
            expiresIn: 3600,
        };

        const cookie = createCookie(tokenData);
        expect(cookie).toBe('refreshToken=sample_refresh_token; HttpOnly; Max-Age=3600; Path=/; Secure; SameSite=Lax');
    });

    it('should create a cookie string with SameSite=Lax in development', () => {
        process.env.NODE_ENV = 'development';
        const { createCookie } = require("../../utils/cookies");

        const tokenData = {
            token: 'sample_refresh_token',
            expiresIn: 3600,
        };

        const cookie = createCookie(tokenData);
        expect(cookie).toBe('refreshToken=sample_refresh_token; HttpOnly; Max-Age=3600; Path=/; SameSite=Lax');
    });
}); 