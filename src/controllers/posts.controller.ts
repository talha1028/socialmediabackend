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
  UseGuards,
  Request,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostService } from '../services/posts.service';
import { JwtAuthGuard } from '../guards/jwtauth.guard';
import { UserOwnershipGuard } from '../guards/userownership.guard';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';

@Controller('posts')
export class PostsController {
  constructor(private readonly postService: PostService) {}

  /** ✅ Create a new post */
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('media'))
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', example: 'My first post with media' },
        media: { type: 'string', format: 'binary' },
      },
      required: ['media'],
    },
  })
  async create(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body('content') content: string,
  ) {
    const post = await this.postService.createPost(
      req.user.userId,
      content,
      file?.filename,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Post created successfully',
      data: post,
    };
  }

  /** ✅ Fetch all posts */
  @Get()
  async findAll() {
    const posts = await this.postService.getAllPosts();
    return {
      statusCode: HttpStatus.OK,
      message: 'Posts fetched successfully',
      data: posts,
    };
  }

  /** ✅ Fetch single post */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const post = await this.postService.getPostById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Post fetched successfully',
      data: post,
    };
  }

  /** ✅ Update a post (ownership guard) */
  @Put(':id')
  @UseGuards(JwtAuthGuard, UserOwnershipGuard)
  @UseInterceptors(FileInterceptor('media'))
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body('content') content?: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const post = await this.postService.updatePost(
      id,
      req.user.userId, // ✅ fixed parameter order
      content,
      file?.filename,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Post updated successfully',
      data: post,
    };
  }

  /** ✅ Delete a post (ownership guard) */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, UserOwnershipGuard)
  async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    await this.postService.deletePost(id, req.user.userId);
    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Post deleted successfully',
    };
  }

  /** ✅ Like a post */
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async likePost(@Request() req, @Param('id', ParseIntPipe) postId: number) {
    const message = await this.postService.likePost(req.user.userId, postId);
    return {
      statusCode:
        message === 'Post already liked'
          ? HttpStatus.CONFLICT
          : HttpStatus.CREATED,
      message,
    };
  }

  /** ✅ Unlike a post */
  @Delete(':id/unlike')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async unlikePost(@Request() req, @Param('id', ParseIntPipe) postId: number) {
    const message = await this.postService.unlikePost(
      req.user.userId,
      postId,
    );

    return {
      statusCode:
        message === 'You have not liked this post'
          ? HttpStatus.NOT_FOUND
          : HttpStatus.NO_CONTENT,
      message,
    };
  }

  /** ✅ Get comments for a post */
  @Get(':id/comments')
  async getComments(@Param('id', ParseIntPipe) postId: number) {
    const comments = await this.postService.getComments(postId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Comments fetched successfully',
      data: comments,
    };
  }
}
