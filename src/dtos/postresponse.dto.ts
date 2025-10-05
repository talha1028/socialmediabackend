export class PostResponseDto {
  id: number;
  content: string;
  mediaUrl: string;
  createdAt?: Date;

  user: {
    id: number;
    username: string;
  };

  commentsCount: number;
  likesCount: number;
}
