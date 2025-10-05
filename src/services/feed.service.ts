import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like as TypeOrmLike } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { FeedPostDto, FeedAuthorDto } from '../dtos/feedpost.dto'

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /** 🔹 Mapper: Post Entity → FeedPostDto */
  private toFeedPostDto(post: Post, currentUserId?: number): FeedPostDto {
    return {
      id: post.id,
      content: post.content,
      mediaUrl: post.mediaUrl,
      author: {
        id: post.user.id,
        username: post.user.username,
        avatarUrl: post.user.avatarUrl,
      } as FeedAuthorDto,
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0,
      isLikedByMe: post.likes?.some(l => l.user.id === currentUserId) || false,
      createdAt: post.createdAt,
    };
  }

  /** 🔹 Get public timeline (all posts) with pagination */
  async getPublicTimeline(userId: number, page = 1, limit = 20) {
    const [posts, total] = await this.postsRepository.findAndCount({
      relations: ['user', 'comments', 'likes', 'likes.user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: posts.map(post => this.toFeedPostDto(post, userId)),
      meta: {
        total,
        page,
        limit,
        hasMore: page * limit < total,
      },
    };
  }

  /** 🔹 Search users by username or email */
  async searchUsers(query: string) {
    const users = await this.usersRepository.find({
      where: [
        { username: TypeOrmLike(`%${query}%`) },
        { email: TypeOrmLike(`%${query}%`) },
      ],
      take: 20,
    });

    return users.map(
      (u): FeedAuthorDto => ({
        id: u.id,
        username: u.username,
        avatarUrl: u.avatarUrl,
      }),
    );
  }

  /** 🔹 Search posts by content */
  async searchPosts(query: string, userId?: number) {
    const posts = await this.postsRepository.find({
      where: { content: TypeOrmLike(`%${query}%`) },
      relations: ['user', 'comments', 'likes', 'likes.user'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return posts.map(post => this.toFeedPostDto(post, userId));
  }
}
