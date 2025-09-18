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
export enum UserRole {
  USER = 1,
  ADMIN = 2,
  SUPERADMIN = 3,
}
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;
  
  @OneToMany(() => Like, like => like.user)
  likes: Like[];

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  coverPhotoUrl: string;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'followers',
    joinColumn: { name: 'following_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'follower_id', referencedColumnName: 'id' }
  })
  followers: User[];

  @ManyToMany(() => User)
  following: User[];

  @OneToMany(() => Post, post => post.user)
  posts: Post[];

  @OneToMany(() => Comment, comment => comment.user)
  comments: Comment[];

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ nullable: true })
  lastLogin: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}