import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module.js'

async function bootstrap () {
  const app = await NestFactory.create(AppModule)
  app.enableCors()

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Registro de Ingresos - Lab Robótica')
    .setDescription(
      [
        'API REST del sistema local de registro de ingresos por eventos.',
        '',
        '### Contrato MQTT (ESP32-CAM → Mosquitto :1883)',
        '- **Tópico de eventos (`lab/camera/events`):**',
        '  `{ "device_id": "robotica-camera-01", "event_id": "evt-000125", "event_type": "motion_detected" | "presence_cleared", "timestamp": "2026-11-25T22:00:00Z" }`',
        '- **Tópico de estado (`lab/camera/status`):**',
        '  `{ "device_id": "robotica-camera-01", "status": "online", "stream_url": "http://<IP-ESP32>:81/stream", "timestamp": "2026-11-25T22:00:00Z" }`'
      ].join('\n')
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/docs', app, document)

  await app.listen(process.env.PORT ?? 8000)
}
bootstrap()
