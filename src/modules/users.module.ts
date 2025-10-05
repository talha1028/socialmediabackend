
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from '../services/user.services';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { UsersController } from 'src/controllers/user.controller';
import { EmailModule } from './email.module';
import { MulterCustomModule } from './multer.module';
import { Follow } from 'src/entities/follow.entity';
import { Like } from 'src/entities/like.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Post, Comment,Follow,Like]),
    EmailModule,
    MulterCustomModule
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // export for AuthModule or others
})
export class UsersModule {}
