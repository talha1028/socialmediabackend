import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendRequest } from '../entities/friendrequest.entity';
import { User } from '../entities/user.entity';
import { FriendRequestsService } from '../services/friendrequest.service';
import { FriendRequestsController } from '../controllers/friendrequest.controller';
import { SocketModule } from './socket.module';
import { Follow } from 'src/entities/follow.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FriendRequest, User,Follow]),
    forwardRef(() => SocketModule), // ✅ Fix circular dependency
  ],
  providers: [FriendRequestsService],
  controllers: [FriendRequestsController],
  exports: [FriendRequestsService],
})
export class FriendRequestsModule {}
