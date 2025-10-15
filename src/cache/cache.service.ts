import { Service } from 'typedi';
import * as redis from 'redis';

@Service()
export class CacheService {
//   private client: RedisClientType;

 constructor(private redisClient: redis.RedisClientType) {}

  // 📦 Sauvegarde une valeur avec une durée de vie (TTL en secondes)
  public async set(key: string, value: any, ttl?: number) {
    const data = JSON.stringify(value);
    if (ttl) {
      await this.redisClient.setEx(key, ttl, data);
    } else {
      await this.redisClient.set(key, data);
    }
  }

  // 📤 Récupère une valeur
  public async get<T = any>(key: string): Promise<T | null> {
    const data = (await this.redisClient.get(key)) as string;
    return data ? JSON.parse(data) : null;
  }

  // 🗑️ Supprime une clé
  public async del(key: string) {
    await this.redisClient.del(key);
  }
    // 🔥 Vide complètement le cache (optionnel, utile pour le dev)
   public async clear() {
    await this.redisClient.flushAll();
  }
}
