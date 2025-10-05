import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostService } from '../services/posts.service';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { Comment } from '../entities/comment.entity';
import { Like } from '../entities/like.entity';
import { PostsController } from 'src/controllers/posts.controller';
import { MulterCustomModule } from './multer.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User, Comment, Like])
            ,MulterCustomModule],
  providers: [PostService],
  exports: [PostService],
  controllers: [PostsController]
  
})
export class PostsModule {}
