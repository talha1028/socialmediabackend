import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedService } from '../services/feed.service';
import { FeedController } from '../controllers/feed.controller';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { Follow } from 'src/entities/follow.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User,Follow])],
  providers: [FeedService],
  controllers: [FeedController],
})
export class FeedModule {}
