import {
  Controller,
  Get,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { FeedService } from '../services/feed.service.';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  /** Get public timeline with optional pagination */
  @Get()
  async getPublicTimeline(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const posts = await this.feedService.getPublicTimeline(page, limit);
    return {
      statusCode: HttpStatus.OK,
      message: 'Public timeline fetched successfully',
      data: posts,
    };
  }

  /** Search users by username or email */
  @Get('search/users')
  async searchUsers(@Query('q') query: string) {
    if (!query || query.trim() === '') {
      return { statusCode: HttpStatus.BAD_REQUEST, message: 'Search query cannot be empty' };
    }
    const users = await this.feedService.searchUsers(query);
    return {
      statusCode: HttpStatus.OK,
      message: `Users matching '${query}'`,
      data: users,
    };
  }

  /** Search posts by content */
  @Get('search/posts')
  async searchPosts(@Query('q') query: string) {
    if (!query || query.trim() === '') {
      return { statusCode: HttpStatus.BAD_REQUEST, message: 'Search query cannot be empty' };
    }
    const posts = await this.feedService.searchPosts(query);
    return {
      statusCode: HttpStatus.OK,
      message: `Posts matching '${query}'`,
      data: posts,
    };
  }
}
