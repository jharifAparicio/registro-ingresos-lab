import { Entity, PrimaryColumn, Column } from 'typeorm'

@Entity('devices')
export class Device {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: string

  @Column()
  streamUrl!: string

  @Column({ default: 'offline' })
  status!: 'online' | 'offline'

  @Column({ type: 'timestamptz', nullable: true })
  lastSeenAt!: Date | null
}
