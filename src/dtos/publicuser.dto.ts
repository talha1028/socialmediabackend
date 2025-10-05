export class PublicUserDto {
  email: string;
  username: string;
  isApproved: boolean;

  followersCount: number;
  followingCount: number;
  postsCount: number;
}
