import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../services/user.services';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService, 
  ) { }

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
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    user.refreshToken = refreshToken; 
    await this.usersService.update(user.id, { refreshToken });
    return {
      accessToken,refreshToken
    };
  }

  async updateLastLogin(userId: number) {
    await this.usersService.updatelastlogin(userId);
  }
  
  async refreshToken(refreshToken: string) {
    try {
      // ✅ verify the token
      const payload = this.jwtService.verify(refreshToken);

      // ✅ find user with this refresh token in DB
      const user = await this.usersService.findById(payload.userId);
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // ✅ issue new access token
      const newAccessToken = this.jwtService.sign(
        { userId: user.id, username: user.username },
        { expiresIn: '15m' },
      );

      return { accessToken: newAccessToken };
    } catch (err) {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }
  }

}
