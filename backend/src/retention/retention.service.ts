import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { LessThan, Repository } from 'typeorm'
import { Cron, CronExpression } from '@nestjs/schedule'
import { unlinkSync, existsSync } from 'node:fs'
import { Event } from '../database/entities/event.entity.js'
import { Config } from '../database/entities/config.entity.js'

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name)

  constructor (
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(Config) private readonly configRepo: Repository<Config>
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanExpiredVideos () {
    const config = await this.configRepo.findOne({ where: { id: 1 } })
    const retentionDays = config?.retentionDays ?? 30

    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    const expired = await this.eventRepo.find({
      where: { startedAt: LessThan(cutoff) }
    })

    for (const evt of expired) {
      if (evt.videoPath && existsSync(evt.videoPath)) {
        try {
          unlinkSync(evt.videoPath)
        } catch (err) {
          this.logger.warn(`No se pudo eliminar ${evt.videoPath}: ${(err as Error).message}`)
        }
      }
      await this.eventRepo.delete(evt.id)
    }

    if (expired.length > 0) {
      this.logger.log(`Retención: ${expired.length} grabaciones vencidas eliminadas`)
    }
  }
}
