import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { User } from '../database/entities/user.entity.js'
import { Config } from '../database/entities/config.entity.js'
import { AuthService } from './auth.service.js'
import { AuthController } from './auth.controller.js'
import { JwtAuthGuard } from './jwt.guard.js'

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Config]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'robotica-local-secret-2026',
      signOptions: { expiresIn: '7d' }
    })
  ],
  providers: [AuthService, JwtAuthGuard],
  controllers: [AuthController],
  exports: [JwtModule, JwtAuthGuard]
})
export class AuthModule {}
