import { Expose, Type } from 'class-transformer';

export class FeedAuthorDto {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  avatarUrl: string;
}

export class FeedPostDto {
  @Expose()
  id: number;

  @Expose()
  content: string;

  @Expose()
  mediaUrl: string;

  @Expose()
  @Type(() => FeedAuthorDto)
  author: FeedAuthorDto;

  @Expose()
  likesCount: number;

  @Expose()
  commentsCount: number;

  @Expose()
  isLikedByMe: boolean;

  @Expose()
  createdAt: Date;
}
