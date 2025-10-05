// src/modules/friend-requests.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendRequest } from '../entities/friendrequest.entity';
import { User } from '../entities/user.entity';
import { FriendRequestsService } from '../services/friendrequest.service';
import { FriendRequestsController } from '../controllers/friendrequest.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FriendRequest, User])],
  providers: [FriendRequestsService],
  controllers: [FriendRequestsController],
})
export class FriendRequestsModule {}
