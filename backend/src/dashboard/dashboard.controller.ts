import { Body, Controller, Get, NotFoundException, Param, Patch, Query, Req, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiQuery, ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Between, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm'
import { createReadStream, existsSync, statSync } from 'node:fs'
import type { Request, Response } from 'express'
import { JwtAuthGuard } from '../auth/jwt.guard.js'
import { Event } from '../database/entities/event.entity.js'
import { Device } from '../database/entities/device.entity.js'
import { Config } from '../database/entities/config.entity.js'

class UpdateConfigDto {
  @ApiPropertyOptional({ example: 30, description: 'Días de retención de videos' })
  retentionDays?: number

  @ApiPropertyOptional({ example: 300, description: 'Duración mínima de grabación en segundos' })
  minDurationSeconds?: number
}

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class DashboardController {
  constructor (
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(Device) private readonly deviceRepo: Repository<Device>,
    @InjectRepository(Config) private readonly configRepo: Repository<Config>
  ) {}

  @Get('events')
  @ApiOperation({ summary: 'Listar historial de eventos con filtros de fecha' })
  @ApiQuery({ name: 'from', required: false, example: '2026-11-01T00:00:00Z' })
  @ApiQuery({ name: 'to', required: false, example: '2026-11-30T23:59:59Z' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getEvents (
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20'
  ) {
    const take = Math.min(100, Math.max(1, Number(limit) || 20))
    const skip = (Math.max(1, Number(page) || 1) - 1) * take

    const where: FindOptionsWhere<Event> = {}
    if (from && to) {
      where.startedAt = Between(new Date(from), new Date(to))
    } else if (from) {
      where.startedAt = MoreThanOrEqual(new Date(from))
    } else if (to) {
      where.startedAt = LessThanOrEqual(new Date(to))
    }

    const [items, total] = await this.eventRepo.findAndCount({
      where,
      order: { startedAt: 'DESC' },
      take,
      skip
    })

    return { items, total, page: Number(page) || 1, limit: take }
  }

  @Get('events/:id/video')
  @ApiOperation({ summary: 'Reproducir video MP4 del evento (soporta Range)' })
  async streamVideo (@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const evt = await this.eventRepo.findOne({ where: { id } })
    if (!evt?.videoPath || !existsSync(evt.videoPath)) {
      throw new NotFoundException('Video no encontrado')
    }

    const stat = statSync(evt.videoPath)
    const fileSize = stat.size
    const range = req.headers.range

    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-')
      const start = Number.parseInt(startStr, 10)
      const end = endStr ? Number.parseInt(endStr, 10) : fileSize - 1
      const chunkSize = end - start + 1

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4'
      })
      createReadStream(evt.videoPath, { start, end }).pipe(res)
      return
    }

    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4'
    })
    createReadStream(evt.videoPath).pipe(res)
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas generales de actividad' })
  async getStats () {
    const events = await this.eventRepo.find({ where: { status: 'completed' } })
    const totalEvents = events.length
    const totalDurationSeconds = events.reduce((acc, e) => acc + e.durationSeconds, 0)
    const totalSizeBytes = events.reduce((acc, e) => acc + Number(e.sizeBytes), 0)

    const byHour: Record<number, number> = {}
    for (const e of events) {
      const h = new Date(e.startedAt).getHours()
      byHour[h] = (byHour[h] || 0) + 1
    }

    return { totalEvents, totalDurationSeconds, totalSizeBytes, byHour }
  }

  @Get('devices')
  @ApiOperation({ summary: 'Estado de los dispositivos ESP32-CAM' })
  getDevices () {
    return this.deviceRepo.find()
  }

  @Get('config')
  @ApiOperation({ summary: 'Obtener configuración de retención y espacio usado' })
  async getConfig () {
    const config = await this.configRepo.findOne({ where: { id: 1 } })
    const events = await this.eventRepo.find({ select: { sizeBytes: true } })
    const usedBytes = events.reduce((acc, e) => acc + Number(e.sizeBytes), 0)
    return {
      retentionDays: config?.retentionDays ?? 30,
      minDurationSeconds: config?.minDurationSeconds ?? 300,
      usedBytes
    }
  }

  @Patch('config')
  @ApiOperation({ summary: 'Actualizar días de retención o duración mínima' })
  async updateConfig (@Body() body: UpdateConfigDto) {
    const config = (await this.configRepo.findOne({ where: { id: 1 } })) ?? this.configRepo.create()
    if (body.retentionDays !== undefined) config.retentionDays = Math.max(1, body.retentionDays)
    if (body.minDurationSeconds !== undefined) {
      config.minDurationSeconds = Math.max(300, body.minDurationSeconds)
    }
    return this.configRepo.save(config)
  }
}
