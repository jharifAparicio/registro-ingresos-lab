import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { spawn, ChildProcess } from 'node:child_process'
import { mkdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { Event } from '../database/entities/event.entity.js'
import { Config } from '../database/entities/config.entity.js'

interface ActiveRecording {
  eventId: string
  dbId: string
  outputPath: string
  startedAt: Date
  process: ChildProcess
  minDurationReached: boolean
  presenceCleared: boolean
  minTimer: ReturnType<typeof setTimeout>
}

@Injectable()
export class RecordingService {
  private readonly logger = new Logger(RecordingService.name)
  private readonly active = new Map<string, ActiveRecording>()

  constructor (
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(Config) private readonly configRepo: Repository<Config>
  ) {}

  async handleMotionDetected (deviceId: string, eventId: string, streamUrl: string) {
    const existing = this.active.get(deviceId)
    if (existing) {
      existing.presenceCleared = false
      return
    }

    const config = await this.configRepo.findOne({ where: { id: 1 } })
    const minSeconds = config?.minDurationSeconds ?? 300

    const storageBase = process.env.STORAGE_PATH || '/app/storage'
    const dateFolder = new Date().toISOString().slice(0, 10)
    const dir = join(storageBase, dateFolder)
    mkdirSync(dir, { recursive: true })

    const outputPath = join(dir, `${eventId}.mp4`)
    const startedAt = new Date()

    const eventEntity = await this.eventRepo.save(
      this.eventRepo.create({
        eventId,
        deviceId,
        startedAt,
        videoPath: outputPath,
        status: 'recording'
      })
    )

    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-f', 'mjpeg',
      '-i', streamUrl,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      outputPath
    ])

    ffmpeg.on('error', err => {
      this.logger.error(`FFmpeg error for ${eventId}: ${err.message}`)
    })

    const minTimer = setTimeout(() => {
      const rec = this.active.get(deviceId)
      if (!rec) return
      rec.minDurationReached = true
      if (rec.presenceCleared) {
        void this.stopRecording(deviceId)
      }
    }, minSeconds * 1000)

    this.active.set(deviceId, {
      eventId,
      dbId: eventEntity.id,
      outputPath,
      startedAt,
      process: ffmpeg,
      minDurationReached: false,
      presenceCleared: false,
      minTimer
    })

    this.logger.log(`Grabación iniciada: ${eventId} (mínimo ${minSeconds}s)`)
  }

  handlePresenceCleared (deviceId: string) {
    const rec = this.active.get(deviceId)
    if (!rec) return

    rec.presenceCleared = true
    if (rec.minDurationReached) {
      void this.stopRecording(deviceId)
    }
  }

  async stopRecording (deviceId: string) {
    const rec = this.active.get(deviceId)
    if (!rec) return

    clearTimeout(rec.minTimer)
    this.active.delete(deviceId)

    rec.process.kill('SIGTERM')

    const endedAt = new Date()
    const durationSeconds = Math.max(1, Math.round((endedAt.getTime() - rec.startedAt.getTime()) / 1000))

    let sizeBytes = 0
    try {
      sizeBytes = statSync(rec.outputPath).size
    } catch {
      sizeBytes = 0
    }

    await this.eventRepo.update(rec.dbId, {
      endedAt,
      durationSeconds,
      sizeBytes,
      status: sizeBytes > 0 ? 'completed' : 'failed'
    })

    this.logger.log(`Grabación finalizada: ${rec.eventId} (${durationSeconds}s, ${sizeBytes} bytes)`)
  }
}
