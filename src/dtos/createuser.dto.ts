import { IsString, IsNotEmpty, IsEmail, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(20, { message: 'Username must be at most 20 characters' })
  @Matches(/\S/, { message: 'Username cannot be empty or spaces only' })
  username: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @Matches(/\S/, { message: 'First name cannot be empty or spaces only' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @Matches(/\S/, { message: 'Last name cannot be empty or spaces only' })
  lastName: string;

  @IsOptional()
  @IsString()
  @MaxLength(150, { message: 'Bio can be at most 150 characters' })
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  coverPhotoUrl?: string;
}
