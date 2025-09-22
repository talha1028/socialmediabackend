import { Module, Global } from '@nestjs/common';
import { RedisService } from '../services/redis.service';
import { createClient } from 'redis';

@Global() // makes RedisService available everywhere without re-importing
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async () => {
        const client = createClient({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        });
        await client.connect();
        return client;
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
