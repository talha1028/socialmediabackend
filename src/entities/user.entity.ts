import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
  JoinTable
} from 'typeorm';
import { Like } from './like.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
import { FriendRequest } from './friendrequest.entity';
import { Follow } from './follow.entity';

export enum UserRole {
  USER = 1,
  ADMIN = 2,
  SUPERADMIN = 3,
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'int',
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @OneToMany(() => Like, like => like.user, { cascade: true })
  likes: Like[];

  @OneToMany(() => Post, post => post.user, { cascade: true })
  posts: Post[];

  @OneToMany(() => Comment, comment => comment.user, { cascade: true })
  comments: Comment[];

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @OneToMany(() => Follow, follow => follow.follower)
  following: Follow[];

  @OneToMany(() => Follow, follow => follow.following)
  followers: Follow[];



  @Column({ nullable: true })
  refreshToken: string;

  @Column({ nullable: true })
  lastLogin: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  isApproved: boolean;   // ✅ user can only log in if true

  @Column({ nullable: true })
  verificationCode: number;  // OTP sent to email

  @Column({ nullable: true })
  codeExpiresAt: Date;  // expiry time for OTP

  @OneToMany(() => FriendRequest, fr => fr.sender)
  sentRequests: FriendRequest[];

  @OneToMany(() => FriendRequest, fr => fr.receiver)
  receivedRequests: FriendRequest[];

}
