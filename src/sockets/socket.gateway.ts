// socket.gateway.ts

import { Inject, forwardRef } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { FriendRequestsService } from '../services/friendrequest.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private onlineUsers = new Map<number, string>();

  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => FriendRequestsService))
    private readonly friendRequestsService: FriendRequestsService,
  ) { }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.query?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) return client.disconnect();

      const payload = this.jwtService.decode(token) as any;
      const userId = payload?.userId || payload?.id || payload?.sub;

      if (!userId) return client.disconnect();

      this.onlineUsers.set(Number(userId), client.id);
      client.join(`user_${userId}`);
      client.emit('connected', { message: 'Connected', userId });
      console.log(`✅ User ${userId} connected`);
    } catch (e) {
      console.log('❌ Connection error:', e.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.onlineUsers.entries()) {
      if (socketId === client.id) {
        this.onlineUsers.delete(userId);
        console.log(`❌ User ${userId} disconnected`);
      }
    }
  }

  // 🎯 Send friend request
  @SubscribeMessage('sendFriendRequest')
  async handleFriendRequest(
    @MessageBody() data: { senderId: number; receiverId: number },
  ) {
    try {
      await this.friendRequestsService.sendRequest(data.senderId, data.receiverId);
    } catch (err) {
      console.error('❌ Error sending friend request:', err.message);
    }
  }

  // ✅ Accept friend request
  @SubscribeMessage('acceptFriendRequest')
  async handleAcceptFriendRequest(
    @MessageBody() data: { requestId: number; userId: number },
  ) {
    try {
      await this.friendRequestsService.acceptRequest(data.requestId, data.userId);
      console.log(`✅ Friend request ${data.requestId} accepted by user ${data.userId}`);
    } catch (err) {
      console.error('❌ Error accepting friend request:', err.message);
    }
  }

  // ✅ Reject friend request
  @SubscribeMessage('rejectFriendRequest')
  async handleRejectFriendRequest(
    @MessageBody() data: { requestId: number; userId: number },
  ) {
    try {
      await this.friendRequestsService.rejectRequest(data.requestId, data.userId);
      console.log(`❌ Friend request ${data.requestId} rejected by user ${data.userId}`);
    } catch (err) {
      console.error('❌ Error rejecting friend request:', err.message);
    }
  }

  // ✅ Notification helpers
  notifyFriendRequest(receiverId: number, senderId: number, requestId: number) {
    this.server.to(`user_${receiverId}`).emit('friendRequestReceived', { senderId, requestId });
  }

  notifyFriendAccepted(senderId: number, receiverId: number, requestId: number) {
    this.server.to(`user_${senderId}`).emit('friendRequestAccepted', { receiverId, requestId });
    this.server.to(`user_${receiverId}`).emit('friendRequestAccepted', { senderId, requestId });
  }

  notifyFriendRejected(senderId: number, receiverId: number, requestId: number) {
    this.server.to(`user_${senderId}`).emit('friendRequestRejected', { receiverId, requestId });
    this.server.to(`user_${receiverId}`).emit('friendRequestRejected', { senderId, requestId });
  }
  notifyFriendRemoved(userId: number, friendId: number) {
    // Notify both users that the friendship has been removed
    this.server.to(`user_${userId}`).emit('friendRemoved', {
      friendId,
      message: `You are no longer friends with user ${friendId}`,
    });

    this.server.to(`user_${friendId}`).emit('friendRemoved', {
      friendId: userId,
      message: `User ${userId} has removed you from their friend list`,
    });

    console.log(`🗑️ Friendship removed between user ${userId} and user ${friendId}`);
  }

}
