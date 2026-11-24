import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Grabación Extensible (Lógica Central)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debe iniciar grabación por T segundos y extender el fin a ahora + T si llega nuevo movimiento', () => {
    const T = 120_000
    let isRecording = false
    let timer: ReturnType<typeof setTimeout> | null = null
    const onStop = vi.fn(() => {
      isRecording = false
    })

    const handleMotion = () => {
      if (!isRecording) {
        isRecording = true
      }
      if (timer) clearTimeout(timer)
      timer = setTimeout(onStop, T)
    }

    // t = 0s: primer movimiento
    handleMotion()
    expect(isRecording).toBe(true)

    // t = 76s: nuevo movimiento -> extiende a 76 + 120 = 196s
    vi.advanceTimersByTime(76_000)
    handleMotion()
    expect(onStop).not.toHaveBeenCalled()

    // t = 150s: aún debe seguir grabando
    vi.advanceTimersByTime(74_000)
    expect(isRecording).toBe(true)
    expect(onStop).not.toHaveBeenCalled()

    // t = 196s: se cumple el tiempo extendido y se detiene
    vi.advanceTimersByTime(46_000)
    expect(onStop).toHaveBeenCalledTimes(1)
    expect(isRecording).toBe(false)
  })
})
