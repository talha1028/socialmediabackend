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
import { Post } from './post.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  /** Author of the comment */
  @ManyToOne(() => User, user => user.comments, { onDelete: 'CASCADE' })
  user: User;

  /** Post the comment belongs to */
  @ManyToOne(() => Post, post => post.comments, { onDelete: 'CASCADE' })
  post: Post;

  /** Replies to this comment */
  @OneToMany(() => Comment, comment => comment.parent, { cascade: true })
  replies: Comment[];

  /** Parent comment (for replies) */
  @ManyToOne(() => Comment, comment => comment.replies, { nullable: true, onDelete: 'CASCADE' })
  parent: Comment;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
