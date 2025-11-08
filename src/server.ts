import { App } from './app';
import { CacheService } from './cache/cache.service';
import { AuthRoute } from './routes/auth.route';
import { ConversationRoute } from './routes/conversation.route';
import { FriendshipRoute } from './routes/friendship.route';
import { GroupRoute } from './routes/group.route';
import { GroupMemberRoute } from './routes/groupMember.route';
import { MessageRoute } from './routes/message.route';
import { NotificationRoute } from './routes/notification.route';
import { TwoFaRoute } from './routes/twofactor.route';
import { UserRoute } from './routes/users.route';
import { UserSecretRoute } from './routes/userSecret.route';
import { ValidateEnv } from './utils/validateEnv';

ValidateEnv();

const app = new App([new UserRoute(), new AuthRoute(), new FriendshipRoute(), new TwoFaRoute(), new MessageRoute(), new ConversationRoute(),new UserSecretRoute(), new NotificationRoute(), new GroupRoute(), new GroupMemberRoute()]);

app.listen();

// Initialise Redis au démarrage
export const initRedis = app.initRedis();

// Exemple : créer un CacheService réutilisable
export const cacheService = new CacheService(app.redisClient);

//On export socket.io
export const socketInstance = app.getSocketInstance();
