import { Injectable, OnModuleInit, UnauthorizedException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import * as argon2 from 'argon2'
import { User } from '../database/entities/user.entity.js'
import { Config } from '../database/entities/config.entity.js'

@Injectable()
export class AuthService implements OnModuleInit {
  constructor (
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Config) private readonly configRepo: Repository<Config>,
    private readonly jwtService: JwtService
  ) {}

  async onModuleInit () {
    const adminUsername = process.env.ADMIN_USER || 'docente'
    const adminPassword = process.env.ADMIN_PASSWORD || 'LabRobotica2026!'

    const existingUser = await this.userRepo.findOne({ where: { username: adminUsername } })
    if (!existingUser) {
      const passwordHash = await argon2.hash(adminPassword)
      await this.userRepo.save(this.userRepo.create({ username: adminUsername, passwordHash }))
    }

    const existingConfig = await this.configRepo.findOne({ where: { id: 1 } })
    if (!existingConfig) {
      await this.configRepo.save(
        this.configRepo.create({ minDurationSeconds: 300, retentionDays: 30 })
      )
    }
  }

  async login (username: string, password: string) {
    const user = await this.userRepo.findOne({ where: { username } })
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('Credenciales inválidas')
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username
    })

    return { accessToken }
  }

  async changePassword (userId: string, currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('La nueva contraseña debe tener al menos 8 caracteres')
    }

    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user || !(await argon2.verify(user.passwordHash, currentPassword))) {
      throw new UnauthorizedException('La contraseña actual es incorrecta')
    }

    user.passwordHash = await argon2.hash(newPassword)
    await this.userRepo.save(user)

    return { message: 'Contraseña actualizada correctamente' }
  }
}
