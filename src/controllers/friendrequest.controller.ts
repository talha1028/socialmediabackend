// src/controllers/friend-requests.controller.ts
import { Controller, Post, Get, Put, Param, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { FriendRequestsService } from '../services/friendrequest.service';
import { JwtAuthGuard } from '../guards/jwtauth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('friend-requests')
export class FriendRequestsController {
  constructor(private readonly friendRequestsService: FriendRequestsService) { }

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

  @Get('received')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async getReceived(@Request() req) {
    const requests = await this.friendRequestsService.listReceivedRequests(req.user.userId);
    return { statusCode: HttpStatus.OK, requests };
  }

  @Get('sent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async getSent(@Request() req) {
    const requests = await this.friendRequestsService.listSentRequests(req.user.userId);
    return { statusCode: HttpStatus.OK, requests };
  }


}
