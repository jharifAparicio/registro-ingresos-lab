import { describe, it, expect } from 'vitest'

interface VideoFile {
  path: string
  createdAt: Date
  sizeBytes: number
}

describe('Retención Automática y Almacenamiento', () => {
  it('debe identificar archivos vencidos según los días de retención y calcular espacio', () => {
    const now = new Date('2026-11-24T12:00:00Z')
    const retentionDays = 7
    const cutoffMs = now.getTime() - retentionDays * 24 * 60 * 60 * 1000

    const files: VideoFile[] = [
      { path: '/app/storage/old.mp4', createdAt: new Date('2026-11-10T10:00:00Z'), sizeBytes: 5_000_000 },
      { path: '/app/storage/recent.mp4', createdAt: new Date('2026-11-23T10:00:00Z'), sizeBytes: 2_500_000 }
    ]

    const expired = files.filter(f => f.createdAt.getTime() < cutoffMs)
    const kept = files.filter(f => f.createdAt.getTime() >= cutoffMs)
    const usedBytes = kept.reduce((acc, f) => acc + f.sizeBytes, 0)

    expect(expired).toHaveLength(1)
    expect(expired[0].path).toBe('/app/storage/old.mp4')
    expect(kept).toHaveLength(1)
    expect(usedBytes).toBe(2_500_000)
  })
})
