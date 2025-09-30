// src/posts/posts.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from '../services/posts.service';


@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /** Create post with media */
  @Post(':userId')
  @UseInterceptors(FileInterceptor('media'))
  async create(
    @Param('userId', ParseIntPipe) userId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('content') content: string,
  ) {
    return this.postsService.create(userId, content, file?.filename);
  }

  /** Fetch all posts */
  @Get()
  async findAll() {
    return this.postsService.findAll();
  }

  /** Fetch single post */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findOne(id);
  }

  /** Update post (optional new content/media) */
  @Put(':id')
  @UseInterceptors(FileInterceptor('media'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body('content') content?: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.postsService.update(id, content, file?.filename);
  }

  /** Delete post */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.postsService.remove(id);
    return { message: 'Post deleted successfully' };
  }

  /** Like a post */
  @Post(':postId/like/:userId')
  async likePost(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.postsService.likePost(userId, postId);
  }

  /** Unlike a post */
  @Delete(':postId/unlike/:userId')
  async unlikePost(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    await this.postsService.unlikePost(userId, postId);
    return { message: 'Like removed successfully' };
  }

  /** Get comments for a post */
  @Get(':postId/comments')
  async getComments(@Param('postId', ParseIntPipe) postId: number) {
    return this.postsService.getComments(postId);
  }
}
