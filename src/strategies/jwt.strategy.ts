import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './jwtpayload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'), // 👈 matches .env now
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.isApproved) {
      throw new UnauthorizedException('Account not approved');
    }

    return {
      userId: payload.id,
      role: payload.role,
      isApproved: payload.isApproved,
    };
  }
}
