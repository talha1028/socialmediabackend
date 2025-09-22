import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  mediaUrl: string; // URL of image/video

  /** The user who created the post */
  @ManyToOne(() => User, user => user.posts, { onDelete: 'CASCADE' })
  user: User;

  /** Comments on this post — deleted when post is deleted */
  @OneToMany(() => Comment, comment => comment.post, { cascade: true })
  comments: Comment[];

  /** Likes on this post — deleted when post is deleted */
  @OneToMany(() => Like, like => like.post, { cascade: true })
  likes: Like[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
