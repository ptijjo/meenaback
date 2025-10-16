import { hash } from 'bcrypt';
import { Service } from 'typedi';
import { User } from '../interfaces/users.interface';
import { HttpException } from '../exceptions/httpException';
import { UpdateUserDto } from '../dtos/users.dto';
import prisma from '../utils/prisma';
import safeDelete from '../utils/safeDeleteFilePath';
import path from 'path';
import { cacheService } from '../server';
import { Role } from '@prisma/client';

@Service()
export class UserService {
  public user = prisma.user;

  public async findAllUser(): Promise<User[]> {
    let allUser: User[] = await this.user.findMany({
      include: {
        Session: {
          where: {
            isRevoked:false,
          }
        },
        UserSecret: true,
      },
    });

    if (allUser === null) allUser = [];
    
    return allUser;
  }

  public async findUserById(userId: string): Promise<User> {
    const findUser: User = await this.user.findUnique({ where: { id: userId } });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    return findUser;
  }

  public async updateUser(userId: string, userData: UpdateUserDto): Promise<User> {
    const findUser: User = await this.user.findUnique({ where: { id: userId } });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    const updatedUserData = { ...userData };

    // Gestion du rôle
    if (userData.role) {
      if (userData.role !== 'admin') {
        throw new HttpException(409, 'Authorisation admin requise');
      }
      updatedUserData.role = userData.role;
    };

    // Hachage du mot de passe s'il est mis à jour
    if (userData.password) {
      updatedUserData.password = await hash(userData.password, 10);
    };

    // Gestion de l'avatar
    if (userData.avatar && findUser.avatar && userData.avatar !== findUser.avatar) {
     
      try {
        let filePath: string;
        
        // Extraction du chemin après le port (ex: "/public/avatar/...")
        const relativePath = new URL(findUser.avatar).pathname;

        // Vérification si le chemin commence par "/avatar"
        if (!relativePath.startsWith('/avatar')) {
          // Si c'est pas /avatar, on remplace par /avatar/filename
          const fileName = path.basename(relativePath);
          
          filePath = path.join(__dirname, '..', '..', 'public', 'avatar', fileName);
          
        } else {
          // Sinon on construit le chemin local classique
          filePath = path.join(__dirname, '..', '..', relativePath);
        }

        await safeDelete(filePath);

      } catch (err) {
        if (err.code === 'ENOENT') {
          throw new HttpException(409, `Fichier déjà supprimé ou introuvable : ${err.path}`);
        } else {
          throw new HttpException(409, `Erreur lors de la suppression de l'ancien avatar : ${err}`);
        }
      }
    }
  

    const updateUserData = await this.user.update({ where: { id: userId }, data: { ...userData } });
    await cacheService.del(`user:${userId}`);
    return updateUserData;
  }

  public async deleteUser(userId: string,authUser: { id: string; role: string }): Promise<User> {
    const findUser: User = await this.user.findUnique({ where: { id: userId } });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

     if (authUser.id !== userId && authUser.role === String(Role.user)) {
      throw new HttpException(403, 'Not authorized to delete this user');
    }

    const deleteUserData = await this.user.delete({ where: { id: userId } });
    return deleteUserData;
  }
}
