import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  eventId!: string

  @Column()
  deviceId!: string

  @CreateDateColumn({ type: 'timestamptz' })
  startedAt!: Date

  @Column({ type: 'timestamptz', nullable: true })
  endedAt!: Date | null

  @Column({ type: 'int', default: 0 })
  durationSeconds!: number

  @Column({ type: 'text', nullable: true })
  videoPath!: string | null

  @Column({ type: 'bigint', default: 0 })
  sizeBytes!: number

  @Column({ default: 'recording' })
  status!: 'recording' | 'completed' | 'failed'
}
