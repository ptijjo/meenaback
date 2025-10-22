import { hash } from 'bcrypt';
import Container, { Service } from 'typedi';
import { User } from '../interfaces/users.interface';
import { HttpException } from '../exceptions/httpException';
import { UpdateUserDto } from '../dtos/users.dto';
import prisma from '../utils/prisma';
import safeDelete from '../utils/safeDeleteFilePath';
import path from 'path';
import { cacheService } from '../server';
import { Role } from '@prisma/client';
import { TwoFactorService } from './twofactor.service';

@Service()
export class UserService {
  public user = prisma.user;
  public doubleFa = Container.get(TwoFactorService);

  public async findAllUser(): Promise<User[]> {
    let allUser: User[] = await this.user.findMany({where:{desactivateAccountDate:null},
      include: {
        Session: {
          where: {
            isRevoked: false,
          },
        },
        UserSecret: true,
      },
    });

    if (allUser === null) allUser = [];

    return allUser;
  }

  public async findUserById(userId: string): Promise<User> {
    const findUser: User = await this.user.findUnique({ where: { id: userId ,desactivateAccountDate:null} });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    return findUser;
  }

  public async updateUser(userId: string, userData: UpdateUserDto): Promise<{ updateUserData: User; qrCodeUrl?: string }> {
    let qrCodeUrl: string;

    const findUser: User = await this.user.findUnique({ where: { id: userId,desactivateAccountDate:null } });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    const updatedUserData = { ...userData };

    // Gestion du rôle
    if (userData.role) {
      if (userData.role !== 'admin') {
        throw new HttpException(409, 'Authorisation admin requise');
      }
      updatedUserData.role = userData.role;
    }

    // Hachage du mot de passe s'il est mis à jour
    if (userData.password) {
      updatedUserData.password = await hash(userData.password, 10);
    }

    // Gestion de l'avatar
    if (userData.avatar && findUser.avatar && userData.avatar !== findUser.avatar) {
      try {
        const oldUrl = new URL(findUser.avatar);

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

    //Activation du double facteur
    if (userData.is2FaEnable && !findUser.is2FaEnable) {
      qrCodeUrl = (await this.doubleFa.generateSecret(findUser.id)).qrCodeUrl;
    }

    // Désactivation du 2FA
    if (userData.is2FaEnable === false && findUser.is2FaEnable) {
      await prisma.user.update({
        where: { id: userId,desactivateAccountDate:null },
        data: {
          is2FaEnable: false,
          twoFaSecret: null,
        },
      });
    }

    if (typeof userData.avatar !== 'string') {
      delete userData.avatar; // Évite d'envoyer un objet
    }

    const updateUserData = await this.user.update({ where: { id: userId,desactivateAccountDate:null }, data: { ...userData } });
    await cacheService.del(`user:${userId}`);
    return { updateUserData, qrCodeUrl };
  }

  public async deleteUser(userId: string, authUser: { id: string; role: string }): Promise<User> {
    const findUser: User = await this.user.findUnique({ where: { id: userId,desactivateAccountDate:null } });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    if (authUser.id !== userId && authUser.role === String(Role.user)) {
      throw new HttpException(403, 'Not authorized to delete this user');
    }

    const deleteUserData = await this.user.delete({ where: { id: userId,desactivateAccountDate:null } });
    return deleteUserData;
  }
 
}
