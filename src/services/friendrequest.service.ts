import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendRequest, FriendRequestStatus } from '../entities/friendrequest.entity';
import { User } from '../entities/user.entity';
import { SocketGateway } from '../sockets/socket.gateway';

@Injectable()
export class FriendRequestsService {
  constructor(
    @InjectRepository(FriendRequest)
    private friendRequestsRepo: Repository<FriendRequest>,

    @InjectRepository(User)
    private usersRepo: Repository<User>,

    private readonly socketGateway: SocketGateway,
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

    // ✅ Real-time notification
    this.socketGateway.emitFriendRequest(receiverId, senderId);

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

    // ✅ Notify sender
    this.socketGateway.emitToUser(request.sender.id, 'friendRequestAccepted', {
      senderId: request.receiver.id,
      receiverId: request.sender.id,
    });

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

    // ✅ Notify sender
    this.socketGateway.emitToUser(request.sender.id, 'friendRequestRejected', {
      senderId: request.receiver.id,
      receiverId: request.sender.id,
    });

    return updated;
  }

  async listRequests(userId: number): Promise<FriendRequest[]> {
    return this.friendRequestsRepo.find({
      where: { receiver: { id: userId }, status: FriendRequestStatus.PENDING },
    });
  }
}
