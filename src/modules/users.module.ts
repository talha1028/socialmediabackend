
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from '../services/user.services';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Post, Comment]), // inject repositories
  ],
  providers: [UsersService],
  exports: [UsersService], // export for AuthModule or others
})
export class UsersModule {}
