import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { Comment } from '../entities/comment.entity';
import { Like } from '../entities/like.entity';
import { PostResponseDto } from '../dtos/postresponse.dto';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,

    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
  ) { }

  /** ✅ Create a new post */
  async createPost(
    userId: number,
    content: string,
    mediaUrl?: string,
  ): Promise<PostResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!mediaUrl) throw new BadRequestException('Post must include media');

    const post = this.postRepository.create({ content, mediaUrl, user });
    const savedPost = await this.postRepository.save(post);

    return {
      id: savedPost.id,
      content: savedPost.content,
      mediaUrl: savedPost.mediaUrl,
      createdAt: savedPost.createdAt,
      user: {
        id: user.id,
        username: user.username,
      },
      commentsCount: 0,
      likesCount: 0,
    };
  }

  /** ✅ Get all posts */
  async getAllPosts(): Promise<PostResponseDto[]> {
    const posts = await this.postRepository.find({
      relations: ['user', 'comments', 'likes'],
      order: { createdAt: 'DESC' },
    });

    return posts.map((post) => ({
      id: post.id,
      content: post.content,
      mediaUrl: post.mediaUrl,
      createdAt: post.createdAt,
      user: {
        id: post.user.id,
        username: post.user.username,
      },
      commentsCount: post.comments?.length || 0,
      likesCount: post.likes?.length || 0,
    }));
  }

  /** ✅ Get single post */
  async getPostById(postId: number): Promise<PostResponseDto> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['user', 'comments', 'likes'],
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
      commentsCount: post.comments?.length || 0,
      likesCount: post.likes?.length || 0,
    };
  }

  /** ✅ Update post */
  async updatePost(
    postId: number,
    userId: number,
    content?: string,
    mediaUrl?: string,
  ): Promise<PostResponseDto> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['user', 'comments', 'likes'],
    });

    if (!post) throw new NotFoundException('Post not found');
    if (post.user.id !== userId)
      throw new ForbiddenException('You can only update your own posts');

    if (content) post.content = content;
    if (mediaUrl) post.mediaUrl = mediaUrl;

    const updated = await this.postRepository.save(post);

    return {
      id: updated.id,
      content: updated.content,
      mediaUrl: updated.mediaUrl,
      createdAt: updated.createdAt,
      user: {
        id: updated.user.id,
        username: updated.user.username,
      },
      commentsCount: post.comments?.length || 0,
      likesCount: post.likes?.length || 0,
    };
  }

  /** ✅ Delete post */
  async deletePost(postId: number, userId: number): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['user'],
    });

    if (!post) throw new NotFoundException('Post not found');
    if (post.user.id !== userId)
      throw new ForbiddenException('You can only delete your own posts');

    await this.postRepository.remove(post);
  }

  /** ✅ Like post */
  async likePost(userId: number, postId: number): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const post = await this.postRepository.findOne({ where: { id: postId } });

    if (!user) throw new NotFoundException('User not found');
    if (!post) throw new NotFoundException('Post not found');

    const existingLike = await this.likeRepository.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });

    if (existingLike) return 'Post already liked';

    const newLike = this.likeRepository.create({ user, post });
    await this.likeRepository.save(newLike);
    return 'Post liked successfully';
  }

  /** ✅ Unlike post */
  async unlikePost(userId: number, postId: number): Promise<string> {
    const like = await this.likeRepository.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });

    if (!like) return 'You have not liked this post';

    await this.likeRepository.remove(like);
    return 'Post unliked successfully';
  }
  /** ✅ Add comment to a post */
  async addComment(userId: number, postId: number, content: string) {
    if (!content || !content.trim()) {
      throw new BadRequestException('Comment cannot be empty');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    const post = await this.postRepository.findOne({ where: { id: postId } });

    if (!user) throw new NotFoundException('User not found');
    if (!post) throw new NotFoundException('Post not found');

    const comment = this.commentRepository.create({ content, user, post });
    const saved = await this.commentRepository.save(comment);

    return {
      id: saved.id,
      content: saved.content,
      createdAt: saved.createdAt,
      user: {
        id: user.id,
        username: user.username,
      },
    };
  }


  /** ✅ Get all comments for a post */
  async getComments(postId: number) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['comments', 'comments.user'],
    });
    if (!post) throw new NotFoundException('Post not found');

    return post.comments.map((c) => ({
      id: c.id,
      content: c.content,
      user: { id: c.user.id, username: c.user.username },
    }));
  }

}
