import { Service } from 'typedi';
import { UserSecret } from '../interfaces/userSecret.interface';
import { HttpException } from '../exceptions/httpException';
import prisma from '../utils/prisma';
import { UpdateUserSecretDto } from '../dtos/userSecrets.dto';
import safeDelete from '../utils/safeDeleteFilePath';
import path from 'path';
import { cacheService } from '../server';

@Service()
export class UserSecretService {
  public userSecret = prisma.userSecret;

  public async findAllUser(): Promise<UserSecret[]> {
    const allUserSecret: UserSecret[] = await this.userSecret.findMany();
    return allUserSecret;
  }

  public async findUserSecretById(userSecretId: string): Promise<UserSecret> {
    const findUser: UserSecret = await this.userSecret.findUnique({ where: { ID: userSecretId } });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    return findUser;
  }

  public async findUserSecretByUserId(userId: string): Promise<UserSecret> {
    const findUser: UserSecret = await this.userSecret.findUnique({ where: { userId: userId } });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    return findUser;
  }

  public async updateUserSecret(userSecretId: string, userData: UpdateUserSecretDto): Promise<UserSecret> {
    const findUserSecret: UserSecret = await this.userSecret.findUnique({ where: { ID: userSecretId } });
    if (!findUserSecret) throw new HttpException(409, "User doesn't exist");

    // Gestion de l'avatar
    if (userData.avatarSecret && findUserSecret.avatarSecret && userData.avatarSecret !== findUserSecret.avatarSecret) {
      try {
        const oldUrl = new URL(findUserSecret.avatarSecret);

        // Si le fichier est hébergé sur ton propre serveur (localhost ou ton domaine)
        if (oldUrl.hostname === 'localhost' || oldUrl.hostname === '127.0.0.1' || oldUrl.hostname === 'api.meena.cellulenoire.fr') {
          const filePath = path.join(__dirname, '..', '..', oldUrl.pathname);

          console.log("🗑️ Suppression de l'ancien avatar :", filePath);
          await safeDelete(filePath);
        } else {
          console.log('🌍 Ancien avatar hébergé à distance, suppression ignorée.');
        }
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          console.warn(`⚠️ Fichier introuvable : ${err.path}`);
        } else {
          console.error("❌ Erreur lors de la suppression de l'ancien avatar :", err);
          throw new HttpException(409, `Erreur lors de la suppression de l'ancien avatar : ${err}`);
        }
      }
    }

    if (typeof userData.avatarSecret !== 'string') {
      delete userData.avatarSecret; // Évite d'envoyer un objet
    }

    const updateUserSecretData = await this.userSecret.update({ where: { ID: userSecretId }, data: { ...userData } });

    return updateUserSecretData;
  }

  public async deleteUserSecret(userSecretId: string): Promise<UserSecret> {
    const findUserSecret: UserSecret = await this.userSecret.findUnique({ where: { userId: userSecretId } });
    if (!findUserSecret) throw new HttpException(409, "User doesn't exist");

    const deleteUserData = await this.userSecret.delete({ where: { userId: userSecretId } });
    return deleteUserData;
  }
}
