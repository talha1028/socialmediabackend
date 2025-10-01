export class PostResponseDto {
  id: number;
  content: string;
  mediaUrl: string;
  createdAt?: Date;

  user: {
    id: number;
    username: string;
  };

  comments?: {
    id: number;
    content: string;
    user: { id: number; username: string };
  }[];

  likes?: {
    id: number;
    user: { id: number; username: string };
  }[];
}
