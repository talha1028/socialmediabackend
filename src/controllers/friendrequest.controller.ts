// src/controllers/friend-requests.controller.ts
import { Controller, Post, Get, Put, Param, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { FriendRequestsService } from '../services/friendrequest.service';
import { JwtAuthGuard } from '../guards/jwtauth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('friend-requests')
export class FriendRequestsController {
  constructor(private readonly friendRequestsService: FriendRequestsService) {}

  @Post('send/:receiverId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async send(@Request() req, @Param('receiverId') receiverId: number) {
    const request = await this.friendRequestsService.sendRequest(req.user.userId, receiverId);
    return { statusCode: HttpStatus.CREATED, request };
  }

  @Put('accept/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async accept(@Request() req, @Param('id') requestId: number) {
    const request = await this.friendRequestsService.acceptRequest(requestId, req.user.userId);
    return { statusCode: HttpStatus.OK, request };
  }

  @Put('reject/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async reject(@Request() req, @Param('id') requestId: number) {
    const request = await this.friendRequestsService.rejectRequest(requestId, req.user.userId);
    return { statusCode: HttpStatus.OK, request };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async list(@Request() req) {
    const requests = await this.friendRequestsService.listRequests(req.user.userId);
    return { statusCode: HttpStatus.OK, requests };
  }
}
