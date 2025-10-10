import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like as TypeOrmLike } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { FeedPostDto, FeedAuthorDto } from '../dtos/feedpost.dto'
import { Follow } from 'src/entities/follow.entity';
import { In } from 'typeorm';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,
  ) { }

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

  async getPublicTimeline(userId: number, page = 1, limit = 20) {
    const following = await this.followRepository.find({
      where: { follower: { id: userId } },
      relations: ['following'],
    });
    const followingIds = following.map(f => f.following.id);

    // ✅ Explicitly type variables
    let posts: Post[] = [];
    let total: number = 0;
    let source = 'following';

    if (followingIds.length > 0) {
      [posts, total] = await this.postsRepository.findAndCount({
        where: { user: { id: In(followingIds) } },
        relations: ['user', 'comments', 'likes', 'likes.user'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    if (posts.length === 0) {
      source = 'explore';
      [posts, total] = await this.postsRepository.findAndCount({
        relations: ['user', 'comments', 'likes', 'likes.user'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    return {
      data: posts.map(post => this.toFeedPostDto(post, userId)),
      meta: {
        total,
        page,
        limit,
        hasMore: page * limit < total,
        source,
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
