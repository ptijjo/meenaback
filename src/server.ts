import { App } from './app';
import { CacheService } from './cache/cache.service';
import { AuthRoute } from './routes/auth.route';
import { FriendshipRoute } from './routes/friendship.route';
import { TwoFaRoute } from './routes/twofactor.route';
import { UserRoute } from './routes/users.route';
import { ValidateEnv } from './utils/validateEnv';

ValidateEnv();

const app = new App([new UserRoute(), new AuthRoute(), new FriendshipRoute(), new TwoFaRoute()]);

app.listen();

// Initialise Redis au démarrage
export const initRedis = app.initRedis();

// Exemple : créer un CacheService réutilisable
export const cacheService = new CacheService(app.redisClient);
