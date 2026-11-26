import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { LessThan, Repository } from 'typeorm'
import { Cron, CronExpression } from '@nestjs/schedule'
import mqtt, { MqttClient } from 'mqtt'
import { Device } from '../database/entities/device.entity.js'
import { RecordingService } from '../recording/recording.service.js'

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name)
  private client: MqttClient | null = null

  constructor (
    @InjectRepository(Device) private readonly deviceRepo: Repository<Device>,
    private readonly recordingService: RecordingService
  ) {}

  onModuleInit () {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883'
    this.client = mqtt.connect(brokerUrl)

    this.client.on('connect', () => {
      this.logger.log(`Conectado a MQTT: ${brokerUrl}`)
      this.client?.subscribe(['lab/camera/events', 'lab/camera/status'])
    })

    this.client.on('message', (topic, payload) => {
      void this.handleMessage(topic, payload.toString())
    })
  }

  onModuleDestroy () {
    this.client?.end()
  }

  private async handleMessage (topic: string, raw: string) {
    try {
      const data = JSON.parse(raw)
      if (!data.device_id) return

      if (topic === 'lab/camera/status') {
        await this.deviceRepo.save({
          id: data.device_id,
          name: data.name || data.device_id,
          streamUrl: data.stream_url || '',
          status: 'online',
          lastSeenAt: new Date()
        })
        return
      }

      if (topic === 'lab/camera/events') {
        if (data.event_type === 'motion_detected' || data.event_type === 'presence_detected') {
          const device = await this.deviceRepo.findOne({ where: { id: data.device_id } })
          const streamUrl = data.stream_url || device?.streamUrl
          if (!streamUrl) {
            this.logger.warn(`Sin streamUrl para ${data.device_id}`)
            return
          }
          await this.recordingService.handleMotionDetected(
            data.device_id,
            data.event_id || `evt-${Date.now()}`,
            streamUrl
          )
        } else if (data.event_type === 'presence_cleared') {
          this.recordingService.handlePresenceCleared(data.device_id)
        }
      }
    } catch {
      this.logger.warn(`Payload MQTT inválido en ${topic}`)
    }
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async markOfflineDevices () {
    const threshold = new Date(Date.now() - 60_000)
    await this.deviceRepo.update(
      { status: 'online', lastSeenAt: LessThan(threshold) },
      { status: 'offline' }
    )
  }
}
