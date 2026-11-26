import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor (private readonly jwtService: JwtService) {}

  async canActivate (context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization as string | undefined

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token requerido')
    }

    const token = authHeader.slice(7)
    try {
      request.user = await this.jwtService.verifyAsync(token)
      return true
    } catch {
      throw new UnauthorizedException('Token inválido o expirado')
    }
  }
}
