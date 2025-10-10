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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'src/entities/user.entity';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postService: PostService) { }

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

  /** ✅ Fetch all posts (Admin only) */
  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
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
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const post = await this.postService.getPostById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Post fetched successfully',
      data: post,
    };
  }

  /** ✅ Update post (owner or admin only) */
  @Put(':id')
  @UseGuards(JwtAuthGuard, UserOwnershipGuard)
  @ApiBearerAuth('access-token')
  @UseInterceptors(FileInterceptor('media'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', example: 'Updated post text' },
        media: { type: 'string', format: 'binary', description: 'Optional file' },
      },
      required: [],
    },
  })
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body('content') content?: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const post = await this.postService.updatePost(
      id,
      req.user.userId,
      content,
      file?.filename,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Post updated successfully',
      data: post,
    };
  }

  /** ✅ Delete post (owner or admin only) */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, UserOwnershipGuard)
  @ApiBearerAuth('access-token')
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

  /** ✅ Add a comment to a post */
  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', example: 'Nice post!' },
      },
      required: ['text'],
    },
  })
  async addComment(
    @Request() req,
    @Param('id', ParseIntPipe) postId: number,
    @Body('text') text: string,
  ) {
    const comment = await this.postService.addComment(
      req.user.userId,
      postId,
      text,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Comment added successfully',
      data: comment,
    };
  }

  /** ✅ Get comments for a post */
  @Get(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async getComments(@Param('id', ParseIntPipe) postId: number) {
    const comments = await this.postService.getComments(postId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Comments fetched successfully',
      data: comments,
    };
  }
}
