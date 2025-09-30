import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from '../services/seeder.service';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // ✅ this exposes UserRepository
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
