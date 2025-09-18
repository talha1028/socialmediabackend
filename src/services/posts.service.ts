import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { Comment } from '../entities/comment.entity';
import { Like } from '../entities/like.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,

    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
  ) {}

  /** Create a new post */
  async create(userId: string, content: string, mediaUrl?: string): Promise<Post> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const post = this.postsRepository.create({ content, mediaUrl, user });
    return this.postsRepository.save(post);
  }

  /** Fetch all posts */
  async findAll(): Promise<Post[]> {
    return this.postsRepository.find({
      relations: ['user', 'comments', 'likes'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Fetch single post by ID */
  async findOne(id: string): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['user', 'comments', 'likes'],
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  /** Update a post */
  async update(id: string, content?: string, mediaUrl?: string): Promise<Post> {
    const post = await this.findOne(id);
    if (content) post.content = content;
    if (mediaUrl) post.mediaUrl = mediaUrl;
    return this.postsRepository.save(post);
  }

  /** Delete a post */
  async remove(id: string): Promise<void> {
    const post = await this.findOne(id);
    await this.postsRepository.remove(post);
  }

  /** Add a like to a post */
  async likePost(userId: string, postId: string): Promise<Like> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    const post = await this.findOne(postId);
    if (!user) throw new NotFoundException('User not found');

    const existingLike = await this.likesRepository.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });

    if (existingLike) return existingLike; // prevent duplicate likes

    const like = this.likesRepository.create({ user, post });
    return this.likesRepository.save(like);
  }

  /** Remove like from a post */
  async unlikePost(userId: string, postId: string): Promise<void> {
    const like = await this.likesRepository.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });
    if (like) await this.likesRepository.remove(like);
  }

  /** Fetch comments for a post */
  async getComments(postId: string): Promise<Comment[]> {
    const post = await this.findOne(postId);
    return post.comments;
  }
}
