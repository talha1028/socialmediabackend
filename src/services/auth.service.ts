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
  ) { }

  // Validate user credentials
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    if (user.password !== password) {
      console.log('invalid pass')
      return null;
    }
    return user;
  }

  // Generate JWT
  async generateJwt(user: User) {
    const payload = { id: user.id, role: user.role, isApproved: user.isApproved };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '1h' }),
    };
  }

  // auth.service.ts
  async updateLastLogin(userId: number) {
    await this.usersService.updatelastlogin(userId);
  }

}
