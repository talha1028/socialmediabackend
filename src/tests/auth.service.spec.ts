import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../services/user.services';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let jwtService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            updatelastlogin: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('fake-jwt-token'),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  // ✅ validateUser tests
  describe('validateUser', () => {
    it('should return user if credentials are correct', async () => {
      const mockUser = { id: 1, email: 'test@test.com', password: '123' };
      usersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@test.com', '123');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const result = await service.validateUser('fake@test.com', '123');
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue({ email: 'test@test.com', password: '123' });
      const result = await service.validateUser('test@test.com', 'wrong');
      expect(result).toBeNull();
    });
  });

  // ✅ generateJwt tests
  describe('generateJwt', () => {
    it('should generate and save refresh token', async () => {
      const mockUser = { id: 1, role: 'user', isApproved: true };
      usersService.update.mockResolvedValue(true);

      const result = await service.generateJwt(mockUser as any);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(usersService.update).toHaveBeenCalled();
    });
  });

  // ✅ refreshToken tests
  describe('refreshToken', () => {
    it('should return new access token if refresh token valid', async () => {
      const mockUser = { id: 1, username: 'talha', refreshToken: 'refresh-token' };

      jwtService.verify.mockReturnValue({ userId: 1 });
      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.refreshToken('refresh-token');
      expect(result).toHaveProperty('accessToken');
    });

    it('should throw UnauthorizedException if token invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid');
      });

      await expect(service.refreshToken('bad-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
