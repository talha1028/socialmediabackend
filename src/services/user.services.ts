import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from './email.service';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dtos/createuser.dto';
import { UpdateUserDto } from '../dtos/updateuser.dto';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { VerifyOtpDto } from 'src/dtos/verifyotp.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Post)
    private postsRepository: Repository<Post>,

    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,

    private readonly emailService: EmailService,
  ) { }

  /** Create a new user with email verification */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // 1️⃣ Generate OTP and expiry
    const otp = Math.floor(100000 + Math.random() * 900000);
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 2️⃣ Create user entity
    const user = this.usersRepository.create({
      ...createUserDto,
      isApproved: false,
      verificationCode: otp,
      codeExpiresAt,
    });

    // 3️⃣ Save to database
    const savedUser = await this.usersRepository.save(user);

    // 4️⃣ Send verification email
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
  
  

  /** Fetch posts of a user */
  async getPosts(id: number): Promise<Post[]> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['posts'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user.posts;
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
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['followers'],
    });

    if (!user) throw new NotFoundException('User not found');

    // pick only safe fields
    return user.followers.map(follower => ({
      username: follower.username,
      firstName: follower.firstName,
      lastName: follower.lastName,
      bio: follower.bio,
    }));
  }


  /** Fetch following of a user */
  async getFollowing(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['following'],
    });

    if (!user) throw new NotFoundException('User not found');

    // return only safe fields
    return user.following.map(following => ({
      username: following.username,
      firstName: following.firstName,
      lastName: following.lastName,
      bio: following.bio,
    }));
  }

  async follow(userId: number, targetUserId: number): Promise<void> {
    if (userId === targetUserId) {
      throw new BadRequestException('You cannot follow yourself.');
    }

    const user = await this.findOne(userId);
    const target = await this.findOne(targetUserId);

    if (!user || !target) {
      throw new NotFoundException('User or target user not found.');
    }

    if (user.following?.some((f) => f.id === targetUserId)) {
      throw new BadRequestException(`You are already following user ${targetUserId}.`);
    }

    user.following = user.following || [];
    user.following.push(target);

    await this.usersRepository.save(user);

    // 📩 Optional: send notification email to the target user
    // await this.emailService.sendNotificationEmail(
    //   target.email,
    //   '👥 New Follower!',
    //   `${user.username} started following you.`
    // );
  }

  /** Unfollow a user */
  async unfollow(userId: number, targetUserId: number): Promise<void> {
    const user = await this.findOne(userId);
    if (!user) throw new NotFoundException('User not found.');

    if (!user.following?.some((f) => f.id === targetUserId)) {
      throw new BadRequestException(`You are not following user ${targetUserId}.`);
    }

    user.following = user.following.filter((f) => f.id !== targetUserId);

    await this.usersRepository.save(user);
  }

  async findByName(name: string): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.firstName ILIKE :name OR user.lastName ILIKE :name', { name: `%${name}%` })
      .getMany();
  }


}
