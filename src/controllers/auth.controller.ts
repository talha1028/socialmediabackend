import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from 'src/dtos/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** User login */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({
    description: 'Login with email and password',
    type: LoginDto,
    examples: {
      valid: {
        summary: 'Valid login',
        value: {
          email: 'talha@example.com',
          password: '12345678',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns JWT token',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Body() body: LoginDto) {
    const { email, password } = body;

    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    user.lastLogin = new Date();
    this.authService.updateLastLogin(user.id)
    return this.authService.generateJwt(user);
  }
}
