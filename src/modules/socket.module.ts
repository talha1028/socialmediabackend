import { Module, forwardRef } from '@nestjs/common';
import { SocketGateway } from '../sockets/socket.gateway';
import { AuthModule } from './auth.module';
import { FriendRequestsModule } from './friendrequest.module';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => FriendRequestsModule), // ✅ Fix circular dependency
  ],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
