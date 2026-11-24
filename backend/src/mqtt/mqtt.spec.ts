import { describe, it, expect } from 'vitest'

interface MqttMotionEvent {
  device_id: string
  event_id: string
  event_type: 'motion_detected' | 'status'
  timestamp: string
}

const parseMqttPayload = (raw: string): MqttMotionEvent | null => {
  try {
    const data = JSON.parse(raw)
    if (!data.device_id || !data.event_id || !data.event_type || !data.timestamp) {
      return null
    }
    return data as MqttMotionEvent
  } catch {
    return null
  }
}

describe('MQTT Payload Parser', () => {
  it('debe parsear un evento motion_detected válido del ESP32-CAM', () => {
    const raw = JSON.stringify({
      device_id: 'robotica-camera-01',
      event_id: 'evt-000125',
      event_type: 'motion_detected',
      timestamp: '2026-11-24T10:30:00Z'
    })

    const parsed = parseMqttPayload(raw)
    expect(parsed).not.toBeNull()
    expect(parsed?.device_id).toBe('robotica-camera-01')
    expect(parsed?.event_type).toBe('motion_detected')
  })

  it('debe rechazar payloads malformados o incompletos', () => {
    expect(parseMqttPayload('not-json')).toBeNull()
    expect(parseMqttPayload(JSON.stringify({ device_id: 'cam-01' }))).toBeNull()
  })
})
