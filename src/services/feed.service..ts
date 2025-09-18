import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like as TypeOrmLike } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /** Get public timeline (all posts) with optional pagination */
  async getPublicTimeline(page = 1, limit = 20): Promise<Post[]> {
    const [posts] = await this.postsRepository.findAndCount({
      relations: ['user', 'comments', 'likes'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return posts;
  }

  /** Search users by username or email */
  async searchUsers(query: string): Promise<User[]> {
    return this.usersRepository.find({
      where: [
        { username: TypeOrmLike(`%${query}%`) },
        { email: TypeOrmLike(`%${query}%`) },
      ],
      take: 20,
    });
  }

  /** Search posts by content */
  async searchPosts(query: string): Promise<Post[]> {
    return this.postsRepository.find({
      where: { content: TypeOrmLike(`%${query}%`) },
      relations: ['user', 'comments', 'likes'],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }
}
