import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from 'src/services/user.services';
import { CreateUserDto } from '../dtos/createuser.dto';
import { UpdateUserDto } from '../dtos/updateuser.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Create a new user */
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'User created successfully',
      data: { id: user.id, username: user.username, email: user.email },
    };
  }

  /** Fetch all users */
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      statusCode: HttpStatus.OK,
      data: users,
    };
  }

  /** Fetch a single user by ID */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      data: user,
    };
  }

  /** Update a user */
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'User updated successfully',
      data: user,
    };
  }

  /** Delete a user */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
  }

  /** Follow another user */
  @Post(':id/follow/:targetId')
  async follow(@Param('id') userId: string, @Param('targetId') targetUserId: string) {
    await this.usersService.follow(userId, targetUserId);
    return {
      statusCode: HttpStatus.OK,
      message: `User ${userId} now follows ${targetUserId}`,
    };
  }

  /** Unfollow a user */
  @Post(':id/unfollow/:targetId')
  async unfollow(@Param('id') userId: string, @Param('targetId') targetUserId: string) {
    await this.usersService.unfollow(userId, targetUserId);
    return {
      statusCode: HttpStatus.OK,
      message: `User ${userId} unfollowed ${targetUserId}`,
    };
  }

  /** Fetch posts of a user */
  @Get(':id/posts')
  async getPosts(@Param('id') id: string) {
    const posts = await this.usersService.getPosts(id);
    return { statusCode: HttpStatus.OK, data: posts };
  }

  /** Fetch comments of a user */
  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    const comments = await this.usersService.getComments(id);
    return { statusCode: HttpStatus.OK, data: comments };
  }

  /** Fetch followers of a user */
  @Get(':id/followers')
  async getFollowers(@Param('id') id: string) {
    const followers = await this.usersService.getFollowers(id);
    return { statusCode: HttpStatus.OK, data: followers };
  }

  /** Fetch following of a user */
  @Get(':id/following')
  async getFollowing(@Param('id') id: string) {
    const following = await this.usersService.getFollowing(id);
    return { statusCode: HttpStatus.OK, data: following };
  }
}
