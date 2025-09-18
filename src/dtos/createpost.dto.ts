import { IsNotEmpty, IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty({ message: 'Content cannot be empty' })
  @IsString()
  @MaxLength(1000, { message: 'Content is too long. Max 1000 characters.' })
  content: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Media URL must be a valid URL' })
  mediaUrl?: string;
}
