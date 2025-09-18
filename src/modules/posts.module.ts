import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from '../services/posts.service';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { Comment } from '../entities/comment.entity';
import { Like } from '../entities/like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User, Comment, Like])],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
