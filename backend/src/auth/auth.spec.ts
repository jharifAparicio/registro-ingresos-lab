import { describe, it, expect } from 'vitest'

describe('Auth (Argon2 + JWT)', () => {
  it('debe hashear y verificar contraseñas correctamente con Argon2', async () => {
    const argon2 = await import('argon2')
    const plain = 'LabRobotica2026!'
    const hash = await argon2.hash(plain)

    expect(hash).not.toBe(plain)
    expect(await argon2.verify(hash, plain)).toBe(true)
    expect(await argon2.verify(hash, 'wrong-password')).toBe(false)
  })

  it('debe firmar y verificar un token JWT válido', async () => {
    const { JwtService } = await import('@nestjs/jwt')
    const jwt = new JwtService({ secret: 'test-secret' })

    const token = await jwt.signAsync({ sub: 'admin-01', role: 'admin' })
    const payload = await jwt.verifyAsync(token)

    expect(payload.sub).toBe('admin-01')
    expect(payload.role).toBe('admin')
  })
})
