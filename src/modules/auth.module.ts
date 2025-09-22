import { Module } from "@nestjs/common";
import { AuthController } from "../controllers/auth.controller";
import { AuthService } from "../services/auth.service";
import { UsersModule } from "./users.module"; // if Auth depends on Users
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

@Module({
  imports: [
    UsersModule, // 👈 Auth often needs Users for validation
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "superSecretKey", 
      signOptions: { expiresIn: "1h" },
    }),
  ],
  controllers: [AuthController], 
  providers: [AuthService],
  exports: [AuthService], 
})
export class AuthModule {}
