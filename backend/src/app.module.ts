import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ScheduleModule } from '@nestjs/schedule'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { AuthModule } from './auth/auth.module.js'
import { User } from './database/entities/user.entity.js'
import { Device } from './database/entities/device.entity.js'
import { Event } from './database/entities/event.entity.js'
import { Config } from './database/entities/config.entity.js'
import { RecordingService } from './recording/recording.service.js'
import { RetentionService } from './retention/retention.service.js'
import { MqttService } from './mqtt/mqtt.service.js'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Device, Event, Config],
      synchronize: true
    }),
    TypeOrmModule.forFeature([Device, Event, Config]),
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService, RecordingService, RetentionService, MqttService]
})
export class AppModule {}
