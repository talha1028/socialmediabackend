import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendRequest } from '../entities/friendrequest.entity';
import { User } from '../entities/user.entity';
import { FriendRequestsService } from '../services/friendrequest.service';
import { FriendRequestsController } from '../controllers/friendrequest.controller';
import { SocketModule } from './socket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FriendRequest, User]),
    forwardRef(() => SocketModule), // ✅ Fix circular dependency
  ],
  providers: [FriendRequestsService],
  controllers: [FriendRequestsController],
  exports: [FriendRequestsService],
})
export class FriendRequestsModule {}
