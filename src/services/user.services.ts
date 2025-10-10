import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { EmailService } from './email.service';
import { RedisService } from './redis.service';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dtos/createuser.dto';
import { UpdateUserDto } from '../dtos/updateuser.dto';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { VerifyOtpDto } from 'src/dtos/verifyotp.dto';
import { PublicUserDto } from 'src/dtos/publicuser.dto';
import { Follow } from '../entities/follow.entity';
import { PostResponseDto } from '../dtos/postresponse.dto';
import { Like } from '../entities/like.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Post)
    private postsRepository: Repository<Post>,

    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,

    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,

    @InjectRepository(Like)
    private likeRepository: Repository<Like>,

    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
  ) { }

  /** Create a new user with email verification (safe + checked) */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // 🧩 1️⃣ Check for existing email or username
    const existingUser = await this.usersRepository.findOne({
      where: [{ email: createUserDto.email }, { username: createUserDto.username }],
    });

    if (existingUser) {
      if (existingUser.email === createUserDto.email)
        throw new BadRequestException('Email already registered');
      if (existingUser.username === createUserDto.username)
        throw new BadRequestException('Username already taken');
    }

    try {
      // 🧩 2️⃣ Generate OTP and expiry
      const otp = Math.floor(100000 + Math.random() * 900000);
      const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // 🧩 3️⃣ Create user instance
      const user = this.usersRepository.create({
        ...createUserDto,
        isApproved: false,
        verificationCode: otp,
        codeExpiresAt,
      });

      // 🧩 4️⃣ Save to DB
      const savedUser = await this.usersRepository.save(user);

      // 🧩 5️⃣ Send OTP email
      await this.emailService.sendOtpEmail(savedUser.email, savedUser.username, otp);

      console.log(`🆕 User created -> ${savedUser.email}`);
      return savedUser;

    } catch (error) {
      // 🧩 6️⃣ Handle database-level duplicate key error (Postgres code 23505)
      if (error.code === '23505') {
        if (error.detail?.includes('email'))
          throw new BadRequestException('Email already exists');
        if (error.detail?.includes('username'))
          throw new BadRequestException('Username already taken');
      }

      console.error('❌ Error creating user:', error);
      throw new BadRequestException('Failed to create user');
    }
  }


  /** Fetch all users */
  async findAll(): Promise<User[]> {
    console.log('🗄️ Fetching all users from DB (not cached)');
    return this.usersRepository.find({ relations: ['followers', 'following'] });
  }

  /** Fetch single user by ID (with cache) */
  async findOne(id: number): Promise<User> {
    const cacheKey = `user:${id}`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      console.log(`✅ Fetched user:${id} from Redis`);
      return JSON.parse(cached);
    }

    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['followers', 'following', 'posts', 'comments'],
    });
    if (!user) throw new NotFoundException('User not found');

    console.log(`🗄️ Fetched user:${id} from DB`);
    await this.redisService.set(cacheKey, JSON.stringify(user), 60 * 5);
    return user;
  }

  /** Fetch single user by email (for auth) */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  /** Update user */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    const updated = await this.usersRepository.save(user);

    // Clear related caches
    await this.redisService.del(`user:${id}`);
    await this.redisService.del(`user:username:${updated.username}`);
    console.log(`🧹 Cache cleared for user:${id}`);
    return updated;
  }

  /** Update last login */
  async updatelastlogin(userId: number) {
    await this.usersRepository.update(userId, { lastLogin: new Date() });
  }

  /** Delete user */
  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);

    await this.redisService.del(`user:${id}`);
    await this.redisService.del(`user:username:${user.username}`);
    console.log(`🧹 Cache removed for user:${id}`);
  }

  /** Verify OTP */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<boolean> {
    const { email, otp } = verifyOtpDto;
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.codeExpiresAt || user.codeExpiresAt < new Date())
      throw new UnauthorizedException('OTP expired or not set');

    if (user.verificationCode !== Number(otp))
      throw new BadRequestException('Invalid OTP');

    user.isApproved = true;
    await this.usersRepository.save(user);
    console.log(`✅ OTP verified for ${email}`);
    return true;
  }

  /** Resend OTP */
  async resendOtp(email: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    if (user.isApproved)
      throw new BadRequestException('User already verified');

    const otp = Math.floor(100000 + Math.random() * 900000);
    user.verificationCode = otp;
    user.codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.usersRepository.save(user);
    await this.emailService.sendOtpEmail(user.email, user.username, otp);
    console.log(`📩 OTP resent to ${email}`);
  }

  /** Update avatar */
  async updateAvatar(userId: number, filename: string): Promise<string> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const avatarUrl = `/uploads/avatars/${filename}`;
    user.avatarUrl = avatarUrl;
    await this.usersRepository.save(user);

    await this.redisService.del(`user:${userId}`);
    console.log(`🧹 Cleared cache after avatar update for user:${userId}`);
    return avatarUrl;
  }

  /** Fetch posts of a user (cached) */
  async getPosts(id: number): Promise<PostResponseDto[]> {
    const cacheKey = `user:${id}:posts`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      console.log(`✅ Fetched posts for user:${id} from Redis`);
      return JSON.parse(cached);
    }

    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['posts', 'posts.user'],
    });
    if (!user) throw new NotFoundException('User not found');

    console.log(`🗄️ Fetched posts for user:${id} from DB`);
    const results: PostResponseDto[] = [];

    for (const post of user.posts) {
      const commentsCount = await this.commentRepository.count({ where: { post: { id: post.id } } });
      const likesCount = await this.likeRepository.count({ where: { post: { id: post.id } } });

      results.push({
        id: post.id,
        content: post.content,
        mediaUrl: post.mediaUrl,
        createdAt: post.createdAt,
        user: { id: post.user.id, username: post.user.username },
        commentsCount,
        likesCount,
      });
    }

    await this.redisService.set(cacheKey, JSON.stringify(results), 60 * 5);
    return results;
  }

  /** Fetch comments of a user */
  async getComments(id: number): Promise<Comment[]> {
    console.log(`🗄️ Fetching comments of user:${id} from DB`);
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['comments'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user.comments;
  }

  /** Followers (cached) */
  async getFollowers(id: number) {
    const cacheKey = `user:${id}:followers`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      console.log(`✅ Fetched followers of user:${id} from Redis`);
      return JSON.parse(cached);
    }

    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    console.log(`🗄️ Fetched followers of user:${id} from DB`);
    const followers = await this.followRepository.find({
      where: { following: { id } },
      relations: ['follower'],
    });

    const result = followers.map(f => ({
      username: f.follower.username,
      email: f.follower.email,
      isApproved: f.follower.isApproved,
    }));

    await this.redisService.set(cacheKey, JSON.stringify(result), 60 * 5);
    return result;
  }

  /** Following (cached) */
  async getFollowing(id: number) {
    const cacheKey = `user:${id}:following`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      console.log(`✅ Fetched following of user:${id} from Redis`);
      return JSON.parse(cached);
    }

    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    console.log(`🗄️ Fetched following of user:${id} from DB`);
    const following = await this.followRepository.find({
      where: { follower: { id } },
      relations: ['following'],
    });

    const result = following.map(f => ({
      username: f.following.username,
      email: f.following.email,
      isApproved: f.following.isApproved,
    }));

    await this.redisService.set(cacheKey, JSON.stringify(result), 60 * 5);
    return result;
  }

  /** Follow user */
  async follow(userId: number, targetUserId: number): Promise<void> {
    if (userId === targetUserId)
      throw new BadRequestException('You cannot follow yourself.');

    const follower = await this.findById(userId);
    const following = await this.findById(targetUserId);

    if (!follower || !following)
      throw new NotFoundException('User or target not found.');

    const existing = await this.followRepository.findOne({
      where: { follower: { id: userId }, following: { id: targetUserId } },
    });
    if (existing)
      throw new BadRequestException('Already following this user.');

    const follow = this.followRepository.create({ follower, following });
    await this.followRepository.save(follow);

    await this.redisService.del(`user:${userId}:following`);
    await this.redisService.del(`user:${targetUserId}:followers`);
    console.log(`🔄 Cache invalidated for follow/unfollow between ${userId} and ${targetUserId}`);
  }

  /** Unfollow user */
  async unfollow(userId: number, targetUserId: number): Promise<void> {
    const follow = await this.followRepository.findOne({
      where: { follower: { id: userId }, following: { id: targetUserId } },
    });

    if (!follow)
      throw new BadRequestException('Not following this user.');

    await this.followRepository.remove(follow);
    await this.redisService.del(`user:${userId}:following`);
    await this.redisService.del(`user:${targetUserId}:followers`);
    console.log(`🔄 Cache invalidated for unfollow between ${userId} and ${targetUserId}`);
  }

  /** Search users by name (cached) */
  async findByName(name: string): Promise<PublicUserDto[]> {
    const cacheKey = `user:search:${name.toLowerCase()}`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      console.log(`✅ Fetched search "${name}" from Redis`);
      return JSON.parse(cached);
    }

    const users = await this.usersRepository.find({
      where: [
        { firstName: ILike(`%${name}%`) },
        { lastName: ILike(`%${name}%`) },
      ],
      select: ['id', 'email', 'username', 'isApproved'],
    });

    if (!users.length)
      throw new NotFoundException(`No users found with name like "${name}"`);

    console.log(`🗄️ Fetched search "${name}" from DB`);
    const results: PublicUserDto[] = [];

    for (const u of users) {
      const followersCount = await this.followRepository.count({ where: { following: { id: u.id } } });
      const followingCount = await this.followRepository.count({ where: { follower: { id: u.id } } });
      const postsCount = await this.postsRepository.count({ where: { user: { id: u.id } } });

      results.push({
        email: u.email,
        username: u.username,
        isApproved: u.isApproved,
        followersCount,
        followingCount,
        postsCount,
      });
    }

    await this.redisService.set(cacheKey, JSON.stringify(results), 60 * 5);
    return results;
  }

  /** Find by username (cached) */
  async findByUsername(username: string): Promise<PublicUserDto> {
    const cacheKey = `user:username:${username}`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      console.log(`✅ Fetched user "${username}" from Redis`);
      return JSON.parse(cached);
    }

    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user) throw new NotFoundException(`User with username "${username}" not found`);

    console.log(`🗄️ Fetched user "${username}" from DB`);
    const followersCount = await this.followRepository.count({ where: { following: { id: user.id } } });
    const followingCount = await this.followRepository.count({ where: { follower: { id: user.id } } });
    const postsCount = await this.postsRepository.count({ where: { user: { id: user.id } } });

    const result = {
      email: user.email,
      username: user.username,
      isApproved: user.isApproved,
      followersCount,
      followingCount,
      postsCount,
    };

    await this.redisService.set(cacheKey, JSON.stringify(result), 60 * 5);
    return result;
  }

  /** Find by ID (simple DB fetch) */
  async findById(id: number) {
    return this.usersRepository.findOneBy({ id });
  }
}
