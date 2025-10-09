import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { FeedService } from '../services/feed.service';
import { JwtAuthGuard } from '../guards/jwtauth.guard'; // assuming you use JWT
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  /** 🔹 Public timeline (everyone's posts) */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('public')
  async getPublicTimeline(
    @Req() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const userId = req.user.userId; // extracted from JWT payload
    return this.feedService.getPublicTimeline(userId, +page, +limit);
  }

  /** 🔹 Search users */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('search/users')
  async searchUsers(@Query('q') query: string) {
    return this.feedService.searchUsers(query);
  }

  /** 🔹 Search posts */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('search/posts')
  async searchPosts(@Req() req, @Query('q') query: string) {
    const userId = req.user.userId;
    return this.feedService.searchPosts(query, userId);
  }
}
