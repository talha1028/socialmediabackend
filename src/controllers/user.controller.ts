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
} from '@nestjs/common';
import { UsersService } from 'src/services/user.services';
import { CreateUserDto } from '../dtos/createuser.dto';
import { UpdateUserDto } from '../dtos/updateuser.dto';
import { ApiTags, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /** Create a new user */
    @Post()
    @ApiBody({
        description: 'Data required to create a user',
        type: CreateUserDto,
        examples: {
            simpleUser: {
                summary: 'Basic user',
                value: {
                    username: 'talha123',
                    email: 'talha@example.com',
                    password: 'SecurePass123!',
                    firstName: 'Talha',
                    lastName: 'Ayaz',
                },
            },
            withProfile: {
                summary: 'User with profile details',
                value: {
                    username: 'ayazDev',
                    email: 'ayaz.dev@example.com',
                    password: 'Passw0rd@2025',
                    firstName: 'Ayaz',
                    lastName: 'Khan',
                    bio: 'Full stack developer and trader',
                    avatarUrl: 'https://example.com/avatar.png',
                    coverPhotoUrl: 'https://example.com/cover.jpg',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'User created successfully',
        schema: {
            example: {
                statusCode: 201,
                message: 'User created successfully',
                data: {
                    id: 'uuid-123',
                    username: 'talha123',
                    email: 'talha@example.com',
                },
            },
        },
    })
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
    @ApiResponse({
        status: 200,
        description: 'List of all users',
        schema: {
            example: {
                statusCode: 200,
                data: [
                    {
                        id: 'uuid-1',
                        username: 'talha123',
                        email: 'talha@example.com',
                    },
                    {
                        id: 'uuid-2',
                        username: 'ayazDev',
                        email: 'ayaz.dev@example.com',
                    },
                ],
            },
        },
    })
    async findAll() {
        const users = await this.usersService.findAll();
        return {
            statusCode: HttpStatus.OK,
            data: users,
        };
    }

    /** Fetch a single user by ID */
    @Get(':id')
    @ApiParam({ name: 'id', type: String, example: 'uuid-123' })
    @ApiResponse({
        status: 200,
        description: 'Single user object',
        schema: {
            example: {
                statusCode: 200,
                data: {
                    id: 'uuid-123',
                    username: 'talha123',
                    email: 'talha@example.com',
                    firstName: 'Talha',
                    lastName: 'Ayaz',
                    bio: 'Hello! I am Talha',
                },
            },
        },
    })
    async findOne(@Param('id') id: string) {
        const user = await this.usersService.findOne(id);
        return {
            statusCode: HttpStatus.OK,
            data: user,
        };
    }

    /** Update a user */
    @Put(':id')
    @ApiParam({ name: 'id', type: String, example: 'uuid-123' })
    @ApiBody({
        type: UpdateUserDto,
        examples: {
            updateEmail: {
                summary: 'Update user email',
                value: { email: 'updated@example.com' },
            },
            updateProfile: {
                summary: 'Update profile info',
                value: {
                    firstName: 'UpdatedName',
                    lastName: 'UpdatedLast',
                    bio: 'Updated bio for this user',
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'User updated successfully',
        schema: {
            example: {
                statusCode: 200,
                message: 'User updated successfully',
                data: {
                    id: 'uuid-123',
                    username: 'talha123',
                    email: 'updated@example.com',
                },
            },
        },
    })
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
    @ApiParam({ name: 'id', type: String, example: 'uuid-123' })
    @ApiResponse({
        status: 204,
        description: 'User deleted successfully',
    })
    async remove(@Param('id') id: string) {
        await this.usersService.remove(id);
    }

    /** Follow another user */
    @Post(':id/follow/:targetId')
    @ApiParam({ name: 'id', type: String, example: 'uuid-123' })
    @ApiParam({ name: 'targetId', type: String, example: 'uuid-456' })
    @ApiResponse({
        status: 200,
        description: 'User follows another user',
        schema: {
            example: { statusCode: 200, message: 'User uuid-123 now follows uuid-456' },
        },
    })
    async follow(@Param('id') userId: string, @Param('targetId') targetUserId: string) {
        await this.usersService.follow(userId, targetUserId);
        return {
            statusCode: HttpStatus.OK,
            message: `User ${userId} now follows ${targetUserId}`,
        };
    }

    /** Unfollow a user */
    @Post(':id/unfollow/:targetId')
    @ApiParam({ name: 'id', type: String, example: 'uuid-123' })
    @ApiParam({ name: 'targetId', type: String, example: 'uuid-456' })
    @ApiResponse({
        status: 200,
        description: 'User unfollows another user',
        schema: {
            example: { statusCode: 200, message: 'User uuid-123 unfollowed uuid-456' },
        },
    })
    async unfollow(@Param('id') userId: string, @Param('targetId') targetUserId: string) {
        await this.usersService.unfollow(userId, targetUserId);
        return {
            statusCode: HttpStatus.OK,
            message: `User ${userId} unfollowed ${targetUserId}`,
        };
    }

    /** Fetch posts of a user */
    @Get(':id/posts')
    @ApiParam({ name: 'id', type: String, example: 'uuid-123' })
    @ApiResponse({
        status: 200,
        description: 'List of posts by user',
        schema: {
            example: {
                statusCode: 200,
                data: [
                    { id: 'post-1', content: 'My first post', mediaUrl: null },
                    { id: 'post-2', content: 'Having fun!', mediaUrl: 'https://example.com/img.jpg' },
                ],
            },
        },
    })
    async getPosts(@Param('id') id: string) {
        const posts = await this.usersService.getPosts(id);
        return { statusCode: HttpStatus.OK, data: posts };
    }

    /** Fetch comments of a user */
    @Get(':id/comments')
    @ApiParam({ name: 'id', type: String, example: 'uuid-123' })
    @ApiResponse({
        status: 200,
        description: 'List of comments by user',
        schema: {
            example: {
                statusCode: 200,
                data: [
                    { id: 'c1', postId: 'post-1', content: 'Great post!' },
                    { id: 'c2', postId: 'post-2', content: 'Nice picture!' },
                ],
            },
        },
    })
    async getComments(@Param('id') id: string) {
        const comments = await this.usersService.getComments(id);
        return { statusCode: HttpStatus.OK, data: comments };
    }

    /** Fetch followers of a user */
    @Get(':id/followers')
    @ApiParam({ name: 'id', type: String, example: 'uuid-123' })
    @ApiResponse({
        status: 200,
        description: 'Followers list',
        schema: {
            example: {
                statusCode: 200,
                data: [
                    { id: 'uuid-789', username: 'johnDoe' },
                    { id: 'uuid-999', username: 'janeDoe' },
                ],
            },
        },
    })
    async getFollowers(@Param('id') id: string) {
        const followers = await this.usersService.getFollowers(id);
        return { statusCode: HttpStatus.OK, data: followers };
    }

    /** Fetch following of a user */
    @Get(':id/following')
    @ApiParam({ name: 'id', type: String, example: 'uuid-123' })
    @ApiResponse({
        status: 200,
        description: 'Following list',
        schema: {
            example: {
                statusCode: 200,
                data: [
                    { id: 'uuid-456', username: 'devGuy' },
                    { id: 'uuid-321', username: 'coolGal' },
                ],
            },
        },
    })
    async getFollowing(@Param('id') id: string) {
        const following = await this.usersService.getFollowing(id);
        return { statusCode: HttpStatus.OK, data: following };
    }
}
