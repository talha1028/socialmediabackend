import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBody, ApiResponse, ApiParam, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { UsersService } from 'src/services/user.services';
import { CreateUserDto } from 'src/dtos/createuser.dto';
import { UpdateUserDto } from 'src/dtos/updateuser.dto';
import { VerifyOtpDto } from 'src/dtos/verifyotp.dto';
import { JwtAuthGuard } from 'src/guards/jwtauth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { UserOwnershipGuard } from 'src/guards/userownership.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'src/entities/user.entity';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  /** Create a new user (public) */
  @Post()
  @ApiBody({
    type: CreateUserDto,
    examples: {
      default: {
        summary: 'Example user creation',
        value: {
          username: 'talha123',
          email: 'talha@example.com',
          password: '12345678',
          firstName: 'Talha',
          lastName: 'Ayaz',
          bio: 'Software Engineering student',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'User created successfully',
      data: { id: user.id, username: user.username, email: user.email },
    };
  }

  /** Fetch all users (any logged-in user) */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, description: 'List of all users' })
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Users fetched successfully',
      data: users,
    };
  }

  /** Fetch a single user by ID (any logged-in user) */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', type: String, example: '1' })
  async findOne(@Param('id') id: number) {
    const user = await this.usersService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'User fetched successfully',
      data: user,
    };
  }

  /** Search by name (any logged-in user) */
  @Get('search/name/:name')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'name', type: String, example: 'Talha' })
  async searchByName(@Param('name') name: string) {
    const users = await this.usersService.findByName(name);
    return {
      statusCode: HttpStatus.OK,
      message: 'Users fetched successfully',
      data: users,
    };
  }

  /** Update a user (owner OR ADMIN/SUPERADMIN) */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, UserOwnershipGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', type: String, example: '1' })
  @ApiBody({
    type: UpdateUserDto,
    examples: {
      default: {
        summary: 'Update profile example',
        value: {
          firstName: 'UpdatedFirst',
          lastName: 'UpdatedLast',
          bio: 'Updated bio text here',
        },
      },
    },
  })
  async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'User updated successfully',
      data: user,
    };
  }

  /** Delete a user (owner OR ADMIN/SUPERADMIN) */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, UserOwnershipGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', type: String, example: '1' })
  async remove(@Param('id') id: number) {
    await this.usersService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'User deleted successfully',
    };
  }

  /** Resend OTP (public) */
  @Post('resend-otp')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'talha@example.com' },
      },
      required: ['email'],
    },
  })
  async resendOtp(@Body('email') email: string) {
    await this.usersService.resendOtp(email);
    return {
      statusCode: HttpStatus.OK,
      message: 'OTP resent successfully',
    };
  }

  /** Verify OTP (public) */
  @Post('verify-otp')
  @ApiBody({
    type: VerifyOtpDto,
    examples: {
      default: {
        summary: 'Verify OTP Example',
        value: {
          email: 'talha@example.com',
          otp: 123456,
        },
      },
    },
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    const isValid = await this.usersService.verifyOtp(verifyOtpDto);
    if (!isValid) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid or expired OTP',
      };
    }
    return {
      statusCode: HttpStatus.OK,
      message: 'OTP verified successfully',
    };
  }

  /** Follow another user (logged-in user follows target) */
  @Post('follow/:targetId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'targetId', type: String, example: '2' })
  async follow(
    @Request() req,
    @Param('targetId') targetUserId: number,
  ) {
    const userId = req.user.userId; // comes from JWT payload
    await this.usersService.follow(userId, targetUserId);

    return {
      statusCode: HttpStatus.OK,
      message: `User ${userId} now follows ${targetUserId}`,
    };
  }


  /** Unfollow a user (self only) */
  @Post('unfollow/:targetId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'targetId', type: String, example: '2' })
  async unfollow(
    @Request() req,
    @Param('targetId') targetUserId: number,
  ) {
    const userId = req.user.userId; // extracted from JWT payload
    await this.usersService.unfollow(userId, targetUserId);

    return {
      statusCode: HttpStatus.OK,
      message: `User ${userId} unfollowed ${targetUserId}`,
    };
  }


  /** Fetch posts of a user (any logged-in user) */
  @Get(':id/posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', type: String, example: '1' })
  async getPosts(@Param('id') id: number) {
    const posts = await this.usersService.getPosts(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Posts fetched successfully',
      data: posts,
    };
  }

  /** Fetch comments of a user (any logged-in user) */
  @Get(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', type: String, example: '1' })
  async getComments(@Param('id') id: number) {
    const comments = await this.usersService.getComments(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Comments fetched successfully',
      data: comments,
    };
  }
  /** Upload avatar (logged-in user only) */
  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    const userId = req.user.userId; // comes from JWT payload
    const avatarUrl = await this.usersService.updateAvatar(userId, file.filename);

    return {
      statusCode: HttpStatus.OK,
      message: 'Avatar uploaded successfully',
      data: { avatarUrl },
    };
  }
  /** Fetch followers of a user (any logged-in user) */
  @Get(':id/followers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', type: String, example: '1' })
  async getFollowers(@Param('id') id: number) {
    const followers = await this.usersService.getFollowers(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Followers fetched successfully',
      data: followers,
    };
  }

  /** Fetch following of a user (any logged-in user) */
  @Get(':id/following')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', type: String, example: '1' })
  async getFollowing(@Param('id') id: number) {
    const following = await this.usersService.getFollowing(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Following fetched successfully',
      data: following,
    };
  }
}
