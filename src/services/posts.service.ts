import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { Comment } from '../entities/comment.entity';
import { Like } from '../entities/like.entity';
import { PostResponseDto } from 'src/dtos/postresponse.dto';
import { LikeResponseDto } from 'src/dtos/likeresponse.dto';

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
  ) { }

  /** Create a new post */
  async create(userId: number, content: string, mediaUrl: string): Promise<PostResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!mediaUrl) throw new BadRequestException('Post must include media');

    const post = this.postsRepository.create({ content, mediaUrl, user });
    this.postsRepository.save(post);
    return {
      id: post.id,
      content: post.content,
      mediaUrl: post.mediaUrl,
      user: {
        id: user.id,
        username: user.username,
      },
    }
  }

  /** Fetch all posts */
  async findAll(): Promise<PostResponseDto[]> {
    const posts = await this.postsRepository.find({
      relations: ['user', 'comments', 'comments.user', 'likes', 'likes.user'],
      order: { createdAt: 'DESC' },
    });

    return posts.map(post => ({
      id: post.id,
      content: post.content,
      mediaUrl: post.mediaUrl,
      createdAt: post.createdAt,
      user: {
        id: post.user.id,
        username: post.user.username,
      },
      comments: post.comments?.map(c => ({
        id: c.id,
        content: c.content,
        user: {
          id: c.user.id,
          username: c.user.username,
        }
      })),
      likes: post.likes?.map(l => ({
        id: l.id,
        user: {
          id: l.user.id,
          username: l.user.username,
        }
      })),
    }));
  }

  /** Fetch single post */
  async findOne(id: number): Promise<PostResponseDto> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['user', 'comments', 'comments.user', 'likes', 'likes.user'],
    });

    if (!post) throw new NotFoundException('Post not found');

    return {
      id: post.id,
      content: post.content,
      mediaUrl: post.mediaUrl,
      createdAt: post.createdAt,
      user: {
        id: post.user.id,
        username: post.user.username,
      },
      comments: post.comments?.map(c => ({
        id: c.id,
        content: c.content,
        user: {
          id: c.user.id,
          username: c.user.username,
        }
      })),
      likes: post.likes?.map(l => ({
        id: l.id,
        user: {
          id: l.user.id,
          username: l.user.username,
        }
      })),
    };
  }


  /** Update a post */
  async update(id: number, content?: string, mediaUrl?: string, userId?: number): Promise<Post> {
    const post = await this.findOne(id);

    if (post.user.id !== userId) {
      throw new ForbiddenException('You do not have permission to update this post');
    }

    if (content) post.content = content;
    if (mediaUrl) post.mediaUrl = mediaUrl;

    return this.postsRepository.save(post);
  }

  /** Fetch single post as Entity (for internal use like update/remove) */
  private async findOneEntity(id: number): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['user'], // enough for ownership check
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  /** Delete a post */
  async remove(id: number, userId: number): Promise<void> {
    const post = await this.findOneEntity(id); // ✅ real entity

    if (post.user.id !== userId) {
      throw new ForbiddenException('You do not have permission to delete this post');
    }

    await this.postsRepository.remove(post); // ✅ works now
  }

async likePost(userId: number, postId: number): Promise<LikeResponseDto> {
  const user = await this.usersRepository.findOne({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');

  // ⚠️ Use Entity here, not DTO (your findOne returns DTO)
  const post = await this.postsRepository.findOne({ where: { id: postId } });
  if (!post) throw new NotFoundException('Post not found');

  const existingLike = await this.likesRepository.findOne({
    where: { user: { id: userId }, post: { id: postId } },
    relations: ['user', 'post'],
  });

  if (existingLike) {
    return {
      message: "Liked this post already",
      id: existingLike.id,
      user: { id: user.id, username: user.username },
      post: { id: post.id, content: post.content, mediaurl: post.mediaUrl },
    };
  }

  const newLike = this.likesRepository.create({ user, post });
  const savedLike = await this.likesRepository.save(newLike);

  return {
    message: "New Like added",
    id: savedLike.id,
    user: { id: user.id, username: user.username },
    post: { id: post.id, content: post.content, mediaurl: post.mediaUrl },
  };
}




/** Remove like from a post */
async unlikePost(userId: number, postId: number): Promise<boolean> {
  const like = await this.likesRepository.findOne({
    where: { user: { id: userId }, post: { id: postId } },
  });

  if (!like) return false;

  await this.likesRepository.remove(like);
  return true;
}


  /** Fetch comments for a post (Entity form) */
  async getComments(postId: number): Promise<Comment[]> {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: ['comments', 'comments.user'],
    });
    if (!post) throw new NotFoundException('Post not found');
    return post.comments;
  }

}
