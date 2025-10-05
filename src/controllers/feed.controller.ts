import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { FeedService } from '../services/feed.service';
import { JwtAuthGuard } from '../guards/jwtauth.guard'; // assuming you use JWT

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  /** 🔹 Public timeline (everyone's posts) */
  @UseGuards(JwtAuthGuard) // ensure only logged-in users access feed
  @Get('public')
  async getPublicTimeline(
    @Req() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const userId = req.user.id; // extracted from JWT payload
    return this.feedService.getPublicTimeline(userId, +page, +limit);
  }

  /** 🔹 Search users */
  @UseGuards(JwtAuthGuard)
  @Get('search/users')
  async searchUsers(@Query('q') query: string) {
    return this.feedService.searchUsers(query);
  }

  /** 🔹 Search posts */
  @UseGuards(JwtAuthGuard)
  @Get('search/posts')
  async searchPosts(@Req() req, @Query('q') query: string) {
    const userId = req.user.id;
    return this.feedService.searchPosts(query, userId);
  }
}
