import { Body, Controller, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service.js'
import { JwtAuthGuard } from './jwt.guard.js'

class LoginDto {
  @ApiProperty({ example: 'docente' })
  username!: string

  @ApiProperty({ example: 'LabRobotica2026!' })
  password!: string
}

class ChangePasswordDto {
  @ApiProperty({ example: 'LabRobotica2026!' })
  currentPassword!: string

  @ApiProperty({ example: 'NuevaClaveSegura2026!' })
  newPassword!: string
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor (private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión del docente (devuelve JWT)' })
  login (@Body() body: LoginDto) {
    return this.authService.login(body.username, body.password)
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar contraseña del docente' })
  changePassword (@Req() req: { user: { sub: string } }, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, body.currentPassword, body.newPassword)
  }
}
