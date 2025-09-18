import { Injectable } from '@nestjs/common';
import { UsersService } from '../services/user.services';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService, // inject JwtService
  ) {}

  // Validate user credentials
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;

    return user;
  }

  // Generate JWT
  async generateJwt(user: User) {
    const payload = { id: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '1h' }),
    };
  }
}
