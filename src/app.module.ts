import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth.module';
import { UsersModule } from './modules/users.module';
import { PostsModule } from './modules/posts.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './modules/db.module';
import { BullConfigModule } from './modules/bullconfig.module';
import { DataSource } from 'typeorm';
import { SeedModule } from './modules/seed.module';
import { FeedModule } from './modules/feed.module';
import { FriendRequestsModule } from './modules/friendrequest.module';
import { SocketModule } from './modules/socket.module';
import { RedisModule } from './modules/redis.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    AuthModule,UsersModule,PostsModule,DatabaseModule,BullConfigModule,SeedModule,FeedModule,FriendRequestsModule,SocketModule,RedisModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor (datasource: DataSource){
    if(datasource.isInitialized){
      console.log('Db connected');
    }
    else{
      console.log('error while connecting to db')
    }
  }
}
