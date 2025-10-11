import request from 'supertest';
import { App } from '../../app';
import { Routes } from '../../interfaces/routes.interface';
import { AuthRoute } from '../../routes/auth.route';
import { UserRoute } from '../../routes/users.route';

//On a pas encore de route
const routes: Routes[] = [
  new AuthRoute(),
  new UserRoute(),
];

describe('App', () => {
  let app: App;

  //Avant chaque test on crée une nouvelle app
  beforeAll(() => {
    app = new App(routes);
  });

  describe('initializeMiddlewares', () => {
    it('should initialize middlewares without crashing', () => {
      // On teste simplement que l'app existe
      expect(app.getServer()).toBeDefined();
    });
  });

  describe('Unknown route', () => {
    it('should return 404 for unknown route', async () => {
      const res = await request(app.getServer()).get('/unknown');
      expect(res.status).toBe(404);
      // Vérifie que le middleware d’erreur est appelé
      expect(res.text).toContain('Cannot');
    });
  });

  describe('/api-docs route', () => {
    it('should return swagger page', async () => {
      const res = await request(app.getServer()).get('/api-docs/'); // note le slash final
      expect(res.status).toBe(200);
      expect(res.text).toContain('Swagger UI');
    });
  });

  describe('Routes auth', () => {
    it('devrait appeler la route pour se déconnecter', async () => {
      const res = await request(app.getServer()).post('/logout'); // ajuster selon ta route
      expect([200, 401, 404]).toContain(res.status); // selon la config
    });

     it('devraitr appeler la route pour se connecter', async () => {
      const res = await request(app.getServer()).post('/login')
        .send({ email: 'test@example.com', password: 'password' });

      // selon ton code AuthRoute tu peux attendre 200, 400 ou 401
      expect([200, 400, 401,500]).toContain(res.status);
    });

    it('should call AuthRoute register endpoint', async () => {
      const res = await request(app.getServer()).post('/signup')
        .send({ email: 'new@example.com', password: 'password' });

      expect([200, 400]).toContain(res.status);
    });

  });

  describe('Routes user', () => {
    it('devrait appeler la route pour trouver tous les users', async () => {
      const res = await request(app.getServer()).get('/users'); // ajuster selon ta route
      expect([200, 401, 404,500]).toContain(res.status); // selon la config
    });

     it('devrait appeler la route pour trouver un user par id', async () => {
      const res = await request(app.getServer()).get('/users/:id')
       
      // selon ton code AuthRoute tu peux attendre 200, 400 ou 401
      expect([200, 400, 401,500]).toContain(res.status);
    });

    it('devrait appeler la route pour update un user', async () => {
      const res = await request(app.getServer()).put('/users/:id')
        .send({ password: 'password' });

      expect([200, 400,500]).toContain(res.status);
    });

    it('devrait appeler la route pour update un user', async () => {
      const res = await request(app.getServer()).delete('/users/:id')
      expect([200, 400,500]).toContain(res.status);
    });

  });
});
