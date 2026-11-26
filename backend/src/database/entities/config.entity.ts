import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm'

@Entity('config')
export class Config {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'int', default: 300 })
  minDurationSeconds!: number

  @Column({ type: 'int', default: 30 })
  retentionDays!: number

  @UpdateDateColumn()
  updatedAt!: Date
}
