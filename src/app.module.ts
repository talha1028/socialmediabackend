import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './controllers/auth.controller';
import { AuthModule } from './modules/auth.module';
import { UsersModule } from './modules/users.module';
import { PostsModule } from './modules/posts.module';
import {  ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './modules/db.module';
import { BullConfigModule } from './modules/bullconfig.module';
import { DataSource } from 'typeorm';

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
    AuthModule,UsersModule,PostsModule,DatabaseModule,BullConfigModule
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
