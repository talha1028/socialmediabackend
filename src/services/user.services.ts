import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dtos/createuser.dto';
import { UpdateUserDto } from '../dtos/updateuser.dto';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Post)
    private postsRepository: Repository<Post>,

    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
  ) {}

  /** Create a new user using CreateUserDto */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...rest } = createUserDto;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.usersRepository.create({
      ...rest,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  /** Fetch all users */
  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ relations: ['followers', 'following'] });
  }

  /** Fetch single user by ID */
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['followers', 'following', 'posts', 'comments'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Fetch single user by email (for auth) */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  /** Update user */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  /** Delete user */
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  /** Fetch posts of a user */
  async getPosts(id: string): Promise<Post[]> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['posts'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user.posts;
  }

  /** Fetch comments of a user */
  async getComments(id: string): Promise<Comment[]> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['comments'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user.comments;
  }

  /** Fetch followers of a user */
  async getFollowers(id: string): Promise<User[]> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['followers'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user.followers;
  }

  /** Fetch following of a user */
  async getFollowing(id: string): Promise<User[]> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['following'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user.following;
  }

  /** Follow another user */
  async follow(userId: string, targetUserId: string): Promise<void> {
    const user = await this.findOne(userId);
    const target = await this.findOne(targetUserId);

    if (!user.following) user.following = [];
    user.following.push(target);

    await this.usersRepository.save(user);
  }

  /** Unfollow a user */
  async unfollow(userId: string, targetUserId: string): Promise<void> {
    const user = await this.findOne(userId);
    user.following = user.following.filter(f => f.id !== targetUserId);
    await this.usersRepository.save(user);
  }
}
