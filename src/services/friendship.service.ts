import { Service } from 'typedi';
import { Friendship } from '../interfaces/friendship.interface';
import prisma from '../utils/prisma';
import { HttpException } from '../exceptions/httpException';

@Service()
export class FriendshipService {
  public friendship = prisma.friendship;

  // Envoyer une demande d’ami
  public async sendRequest(requesterId: string, addresseeId: string):Promise<Friendship> {
    if (requesterId === addresseeId) throw new HttpException(400, 'Impossible de s’ajouter soi-même.');

    const existing = await this.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });

    if (existing) throw new HttpException(400, 'Une relation existe déjà.');

    return await this.friendship.create({
      data: { requesterId, addresseeId, status: 'pending' },
    });
  }

  // Accepter une demande
  public async acceptRequest(userId: string, requesterId: string):Promise<Friendship> {
    const friendship = await this.friendship.findFirst({
      where: { requesterId, addresseeId: userId, status: 'pending' },
    });

    if (!friendship) throw new HttpException(404, 'Demande introuvable.');

    return await this.friendship.update({
      where: { id: friendship.id },
      data: { status: 'accepted' },
    });
  }

  // Refuser ou supprimer une demande
    public async rejectOrRemove(userId: string, friendId: string): Promise<{ message:string }> {
    const friendship = await this.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: friendId },
          { requesterId: friendId, addresseeId: userId },
        ],
      },
    });

    if (!friendship) throw new HttpException(404, 'Relation introuvable.');

    await prisma.friendship.delete({ where: { id: friendship.id } });

    return { message: 'Relation supprimée avec succès.' };
  }

  // Liste d’amis
  public async getFriends(userId: string):Promise<any> {
    const friendships = await this.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: true,
        addressee: true,
      },
    });

    return friendships.map(f => (f.requesterId === userId ? f.addressee : f.requester));
  }

  // Liste des demandes reçues
  public async getPendingRequests(userId: string): Promise<Friendship[]> {
    return await this.friendship.findMany({
      where: { addresseeId: userId, status: 'pending' },
      include: { requester: true },
    });
  }
}
