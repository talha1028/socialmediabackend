import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*', // ✅ Replace with your frontend URL later
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // userId -> socketId
  private onlineUsers = new Map<number, string>();

  constructor(private readonly jwtService: JwtService) {}

  // ✅ When user connects
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) throw new Error('No token');

      const payload = this.jwtService.verify(token);
      const userId = payload.id;

      this.onlineUsers.set(userId, client.id);
      console.log(`✅ User ${userId} connected`);
    } catch (err) {
      console.log('❌ Socket connection failed:', err.message);
      client.disconnect();
    }
  }

  // ❌ When user disconnects
  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.onlineUsers.entries()) {
      if (socketId === client.id) {
        this.onlineUsers.delete(userId);
        console.log(`❌ User ${userId} disconnected`);
        break;
      }
    }
  }

  // 🎯 For frontend event (optional)
  @SubscribeMessage('sendFriendRequest')
  handleFriendRequest(
    @MessageBody() data: { senderId: number; receiverId: number },
    @ConnectedSocket() client: Socket,
  ) {
    this.emitFriendRequest(data.receiverId, data.senderId);
  }

  // ✅ Universal function for emitting friend request events
  emitFriendRequest(receiverId: number, senderId: number) {
    const receiverSocketId = this.onlineUsers.get(receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('friendRequestReceived', {
        senderId,
      });
      console.log(`📡 Friend request emitted to receiver ${receiverId} from sender ${senderId}`);
    } else {
      console.log(`⚠️ Receiver ${receiverId} is offline`);
    }
  }

  // ✅ Utility for other friend request events (accepted/rejected)
  emitToUser(userId: number, event: string, data: any) {
    const socketId = this.onlineUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      console.log(`📢 Event '${event}' sent to user ${userId}`);
    }
  }
}
