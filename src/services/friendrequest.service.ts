import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FriendRequest,
  FriendRequestStatus,
} from '../entities/friendrequest.entity';
import { User } from '../entities/user.entity';
import { PublicUserDto } from 'src/dtos/publicuser.dto';
import { SocketGateway } from '../sockets/socket.gateway'; // ✅ import gateway

@Injectable()
export class FriendRequestsService {
  constructor(
    @InjectRepository(FriendRequest)
    private friendRequestsRepo: Repository<FriendRequest>,

    @InjectRepository(User)
    private usersRepo: Repository<User>,

    private readonly socketGateway: SocketGateway, // ✅ inject socket gateway
  ) {}

  async sendRequest(senderId: number, receiverId: number): Promise<FriendRequest> {
    if (senderId === receiverId)
      throw new BadRequestException('Cannot send request to yourself');

    const sender = await this.usersRepo.findOne({ where: { id: senderId } });
    const receiver = await this.usersRepo.findOne({ where: { id: receiverId } });

    if (!sender || !receiver)
      throw new NotFoundException('User not found');

    const existing = await this.friendRequestsRepo.findOne({
      where: { sender: { id: senderId }, receiver: { id: receiverId } },
    });

    if (existing)
      throw new BadRequestException('Friend request already exists');

    const request = this.friendRequestsRepo.create({ sender, receiver });
    const saved = await this.friendRequestsRepo.save(request);

    // ✅ Emit socket event (notify receiver)
    this.socketGateway.notifyFriendRequest(receiverId, senderId, saved.id);

    return saved;
  }

  async acceptRequest(requestId: number, userId: number): Promise<FriendRequest> {
    const request = await this.friendRequestsRepo.findOne({
      where: { id: requestId },
      relations: ['receiver', 'sender'],
    });

    if (!request) throw new NotFoundException('Friend request not found');
    if (request.receiver.id !== userId)
      throw new ForbiddenException('Not authorized');

    request.status = FriendRequestStatus.ACCEPTED;
    const updated = await this.friendRequestsRepo.save(request);

    // ✅ Notify both users in real time
    this.socketGateway.notifyFriendAccepted(request.sender.id, request.receiver.id, request.id);

    return updated;
  }

  async rejectRequest(requestId: number, userId: number): Promise<FriendRequest> {
    const request = await this.friendRequestsRepo.findOne({
      where: { id: requestId },
      relations: ['receiver', 'sender'],
    });

    if (!request) throw new NotFoundException('Friend request not found');
    if (request.receiver.id !== userId)
      throw new ForbiddenException('Not authorized');

    request.status = FriendRequestStatus.REJECTED;
    const updated = await this.friendRequestsRepo.save(request);

    // ✅ Notify both users
    this.socketGateway.notifyFriendRejected(request.sender.id, request.receiver.id, request.id);

    return updated;
  }

  async listReceivedRequests(userId: number): Promise<any[]> {
    const requests = await this.friendRequestsRepo.find({
      where: { receiver: { id: userId }, status: FriendRequestStatus.PENDING },
      relations: ['sender', 'receiver'],
    });

    return requests.map(req => ({
      id: req.id,
      status: req.status,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
      sender: this.mapUser(req.sender),
      receiver: this.mapUser(req.receiver),
    }));
  }

  async listSentRequests(userId: number): Promise<any[]> {
    const requests = await this.friendRequestsRepo.find({
      where: { sender: { id: userId }, status: FriendRequestStatus.PENDING },
      relations: ['sender', 'receiver'],
    });

    return requests.map(req => ({
      id: req.id,
      status: req.status,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
      sender: this.mapUser(req.sender),
      receiver: this.mapUser(req.receiver),
    }));
  }

  private mapUser(user: User): PublicUserDto {
    return {
      email: user.email,
      username: user.username,
      isApproved: user.isApproved,
    };
  }
  
  async removeFriend(userId: number, friendUsername: string): Promise<{ message: string }> {
  // Find the friend by username
  const friend = await this.usersRepo.findOne({ where: { username: friendUsername } });
  if (!friend) throw new NotFoundException('Friend not found');

  // Find accepted friend request (in either direction)
  const friendship = await this.friendRequestsRepo.findOne({
    where: [
      { sender: { id: userId }, receiver: { id: friend.id }, status: FriendRequestStatus.ACCEPTED },
      { sender: { id: friend.id }, receiver: { id: userId }, status: FriendRequestStatus.ACCEPTED },
    ],
    relations: ['sender', 'receiver'],
  });

  if (!friendship) throw new NotFoundException('No friendship found with this user');

  // Delete the friendship
  await this.friendRequestsRepo.remove(friendship);

  // ✅ Notify both users (optional, if you want to use socket)
  this.socketGateway.notifyFriendRemoved(userId, friend.id);

  return { message: `You are no longer friends with ${friend.username}` };
}

}
