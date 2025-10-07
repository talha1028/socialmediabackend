import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { EmailService } from './email.service';
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
  ) { }

  /** Create a new user with email verification */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = this.usersRepository.create({
      ...createUserDto,
      isApproved: false,
      verificationCode: otp,
      codeExpiresAt,
    });

    const savedUser = await this.usersRepository.save(user);
    await this.emailService.sendOtpEmail(savedUser.email, savedUser.username, otp);
    return savedUser;
  }

  /** Fetch all users */
  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ relations: ['followers', 'following'] });
  }

  /** Fetch single user by ID */
  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['followers', 'following', 'posts', 'comments'],
    });
    if (!user) throw new NotFoundException('User not found');
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
    return this.usersRepository.save(user);
  }

  /** Update Last Login */

  async updatelastlogin(userId: number) {
    await this.usersRepository.update(userId, { lastLogin: new Date() });
  }

  /** Delete user */
  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }
  //Verify OTP of a user
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<boolean> {
    const { email, otp } = verifyOtpDto;

    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.codeExpiresAt || user.codeExpiresAt < new Date()) {
      throw new UnauthorizedException('OTP expired or not set');
    }

    if (user.verificationCode !== Number(otp)) {
      throw new BadRequestException('Invalid OTP');
    }

    user.isApproved = true;
    await this.usersRepository.save(user);
    return true;
  }
  //Resend otp mail
  async resendOtp(email: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    if (user.isApproved) {
      throw new BadRequestException('User already verified');
    }

    // 1️⃣ Generate new OTP & expiry
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.verificationCode = otp;
    user.codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.usersRepository.save(user);

    // 2️⃣ Send email
    await this.emailService.sendOtpEmail(user.email, user.username, otp);
  }

  async updateAvatar(userId: number, filename: string): Promise<string> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // build a URL or relative path
    const avatarUrl = `/uploads/avatars/${filename}`;
    user.avatarUrl = avatarUrl;

    await this.usersRepository.save(user);
    return avatarUrl;
  }

/** Fetch posts of a user with counts */
async getPosts(id: number): Promise<PostResponseDto[]> {
  const user = await this.usersRepository.findOne({
    where: { id },
    relations: ['posts', 'posts.user'], // only load user info, not likes/comments
  });

  if (!user) throw new NotFoundException('User not found');

  const results: PostResponseDto[] = [];

  for (const post of user.posts) {
    // Count comments and likes from repos
    const commentsCount = await this.commentRepository.count({
      where: { post: { id: post.id } },
    });

    const likesCount = await this.likeRepository.count({
      where: { post: { id: post.id } },
    });

    results.push({
      id: post.id,
      content: post.content,
      mediaUrl: post.mediaUrl,
      createdAt: post.createdAt,

      user: {
        id: post.user.id,
        username: post.user.username,
      },

      // instead of mapping full arrays
      commentsCount,
      likesCount,
    } as PostResponseDto);
  }

  return results;
}



  /** Fetch comments of a user */
  async getComments(id: number): Promise<Comment[]> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['comments'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user.comments;
  }

  /** Fetch followers of a user */
  async getFollowers(id: number) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const followers = await this.followRepository.find({
      where: { following: { id } },
      relations: ['follower'],
    });

    return followers.map(f => ({
      username: f.follower.username,
      email: f.follower.email,
      isApproved: f.follower.isApproved,
    }));
  }



  /** Fetch following of a user */
  async getFollowing(id: number) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const following = await this.followRepository.find({
      where: { follower: { id } },
      relations: ['following'],
    });

    return following.map(f => ({
      username: f.following.username,
      email: f.following.email,
      isApproved: f.following.isApproved,
    }));
  }


  async follow(userId: number, targetUserId: number): Promise<void> {
    if (userId === targetUserId) {
      throw new BadRequestException('You cannot follow yourself.');
    }

    const follower = await this.findById(userId);
    const following = await this.findById(targetUserId);

    if (!follower || !following) {
      throw new NotFoundException('User or target not found.');
    }

    const existing = await this.followRepository.findOne({
      where: { follower: { id: userId }, following: { id: targetUserId } },
    });
    if (existing) {
      throw new BadRequestException('You are already following this user.');
    }

    const follow = this.followRepository.create({ follower, following });
    await this.followRepository.save(follow);
    // 📩 Optional: send notification email to the target user
    // await this.emailService.sendNotificationEmail(
    //   target.email,
    //   '👥 New Follower!',
    //   `${user.username} started following you.`
    // );
  }


  async unfollow(userId: number, targetUserId: number): Promise<void> {
    const follow = await this.followRepository.findOne({
      where: { follower: { id: userId }, following: { id: targetUserId } },
    });

    if (!follow) {
      throw new BadRequestException('You are not following this user.');
    }

    await this.followRepository.remove(follow);
  }

  // Find by firstname or lastname, then count via repos
  async findByName(name: string): Promise<PublicUserDto[]> {
    const users = await this.usersRepository.find({
      where: [
        { firstName: ILike(`%${name}%`) },
        { lastName: ILike(`%${name}%`) },
      ],
      select: ['id', 'email', 'username', 'isApproved'],
    });

    if (!users.length) {
      throw new NotFoundException(`No users found with name like "${name}"`);
    }

    const results: PublicUserDto[] = [];

    for (const u of users) {
      const followersCount = await this.followRepository.count({
        where: { following: { id: u.id } },
      });

      const followingCount = await this.followRepository.count({
        where: { follower: { id: u.id } },
      });

      const postsCount = await this.postsRepository.count({
        where: { user: { id: u.id } },
      });

      results.push({
        email: u.email,
        username: u.username,
        isApproved: u.isApproved,
        followersCount,
        followingCount,
        postsCount,
      });
    }

    return results;
  }

  async findByUsername(username: string): Promise<PublicUserDto> {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user) throw new NotFoundException(`User with username "${username}" not found`);

    const followersCount = await this.followRepository.count({
      where: { following: { id: user.id } },
    });

    const followingCount = await this.followRepository.count({
      where: { follower: { id: user.id } },
    });

    const postsCount = await this.postsRepository.count({
      where: { user: { id: user.id } },
    });

    return {
      email: user.email,
      username: user.username,
      isApproved: user.isApproved,
      followersCount,
      followingCount,
      postsCount,
    };
  }

  // Find by ID
  async findById(id: number) {
    return this.usersRepository.findOneBy({ id });
  }

}
