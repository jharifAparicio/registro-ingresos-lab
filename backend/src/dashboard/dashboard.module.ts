import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module.js'
import { Event } from '../database/entities/event.entity.js'
import { Device } from '../database/entities/device.entity.js'
import { Config } from '../database/entities/config.entity.js'
import { DashboardController } from './dashboard.controller.js'

@Module({
  imports: [TypeOrmModule.forFeature([Event, Device, Config]), AuthModule],
  controllers: [DashboardController]
})
export class DashboardModule {}
