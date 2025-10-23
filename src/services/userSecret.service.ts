import { Service } from 'typedi';
import { UserSecret } from '../interfaces/userSecret.interface';
import { HttpException } from '../exceptions/httpException';
import prisma from '../utils/prisma';


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

  public async updateUserSecret(userSecretId: string, userData: any): Promise<UserSecret> {
    const findUserSecret: UserSecret = await this.userSecret.findUnique({ where: { userId: userSecretId } });
    if (!findUserSecret) throw new HttpException(409, "User doesn't exist");

    const updateUserSecretData = await this.userSecret.update({ where: { userId: userSecretId }, data: { ...userData } });
    return updateUserSecretData;
  }

  public async deleteUserSecret(userSecretId: string): Promise<UserSecret> {
    const findUserSecret: UserSecret = await this.userSecret.findUnique({ where: { userId: userSecretId } });
    if (!findUserSecret) throw new HttpException(409, "User doesn't exist");

    const deleteUserData = await this.userSecret.delete({ where: { userId: userSecretId } });
    return deleteUserData;
  }
}
