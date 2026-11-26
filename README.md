# Sistema de Registro de Ingresos — Laboratorio de Robótica

Sistema local y de bajo costo para el registro de ingresos mediante detección de movimiento (ESP32-CAM + sensor PIR HC-SR501), grabación de video por eventos con FFmpeg, mensajería MQTT y dashboard web.

## Arquitectura

- **Hardware / Firmware (`firmware/`):** ESP32-CAM (OV2640) + PIR HC-SR501. Publica eventos por MQTT y expone flujo MJPEG por HTTP.
- **Broker MQTT (`mosquitto/`):** Eclipse Mosquitto (`1883`).
- **Base de Datos (`db`):** PostgreSQL 16 (red interna).
- **Backend (`backend/`):** NestJS + TypeScript + FFmpeg + Argon2 + JWT.
- **Frontend (`frontend/`):** Astro + Tailwind CSS.
- **Proxy Inverso (`nginx/`):** Nginx (`80`), enruta `/` al frontend y `/api/` al backend.

---

## Requisitos Previos

- Docker y Docker Compose v2+
- `pnpm` (recomendado para instalar dependencias locales en desarrollo)

---

## Configuración Inicial

1. Clonar el repositorio y crear el archivo `.env`:
   ```bash
   cp .env.example .env
   ```
2. Instalar dependencias locales en `backend` y `frontend` (necesario para desarrollo rápido sin reinstalar en Docker):
   ```bash
   pnpm --dir backend install
   pnpm --dir frontend install
   ```
3. Activar los hooks de Git (Husky) para validar ramas, tests y commits:
   ```bash
   git config core.hooksPath .husky
   ```

---

## Desarrollo

Usa automáticamente [compose.yaml](compose.yaml) + [compose.override.yaml](compose.override.yaml):

```bash
# Levantar todos los servicios en modo desarrollo (hot-reload)
docker compose up -d

# Ver logs en tiempo real
docker compose logs -f backend frontend

# Detener servicios
docker compose down
```

**Accesos en desarrollo:**
- Frontend (Astro): `http://localhost:4321`
- Backend (NestJS): `http://localhost:8000`
- Proxy Nginx: `http://localhost`
- Broker MQTT: `mqtt://localhost:1883`

---

## Producción

Usa [compose.yaml](compose.yaml) + [compose.prod.yaml](compose.prod.yaml) para compilar imágenes optimizadas sin volúmenes de código fuente ni puertos de desarrollo expuestos:

```bash
# Construir y levantar en producción
docker compose -f compose.yaml -f compose.prod.yaml up -d --build

# Detener servicios
docker compose -f compose.yaml -f compose.prod.yaml down
```

**Accesos en producción:**
- Dashboard y API (Nginx): `http://localhost` (o la IP local del servidor)
- Broker MQTT (para ESP32-CAM): `mqtt://<IP-DEL-SERVIDOR>:1883`

---

## Estilo de Código y Calidad

- **Formato:** Prettier (`.prettierrc` — sin punto y coma, comillas simples, 2 espacios).
- **Linter:** ESLint con `neostandard` (StandardJS + TypeScript) en `backend/` y `frontend/`.
- **Git Hooks:** Husky (`.husky/pre-commit`) valida formato y lint antes de cada commit.

---

## Contrato MQTT y HTTP para el ESP32-CAM

El backend escucha en el broker **Mosquitto** (`mqtt://<IP-SERVIDOR>:1883`) y espera los siguientes tópicos y payloads JSON:

### 1. Estado del dispositivo (`lab/camera/status`)
Publicar cada ~30 segundos para mantener el estado `online` en el dashboard:
```json
{
  "device_id": "robotica-camera-01",
  "name": "Cámara Entrada Lab",
  "stream_url": "http://<IP-ESP32>:81/stream",
  "status": "online",
  "timestamp": "2026-11-25T23:00:00Z"
}
```

### 2. Eventos de movimiento/presencia (`lab/camera/events`)
- **Inicio / Presencia detectada** (inicia FFmpeg; duración mínima de 5 minutos / 300 s):
```json
{
  "device_id": "robotica-camera-01",
  "event_id": "evt-000125",
  "event_type": "motion_detected",
  "timestamp": "2026-11-25T23:00:00Z"
}
```
- **Ambiente vacío** (finaliza la grabación si ya se cumplieron los 5 minutos mínimos):
```json
{
  "device_id": "robotica-camera-01",
  "event_id": "evt-000125",
  "event_type": "presence_cleared",
  "timestamp": "2026-11-25T23:06:00Z"
}
```

### 3. Documentación API (Swagger)
- Vía Nginx: `http://localhost/api/docs`
- Directo en desarrollo: `http://localhost:8000/docs`

### 4. Simular eventos MQTT sin cámara física
```bash
# Registrar cámara online
docker compose exec mqtt mosquitto_pub -t lab/camera/status -m '{"device_id":"robotica-camera-01","stream_url":"http://192.168.1.50:81/stream","status":"online"}'

# Simular detección de movimiento
docker compose exec mqtt mosquitto_pub -t lab/camera/events -m '{"device_id":"robotica-camera-01","event_id":"evt-test-01","event_type":"motion_detected","timestamp":"2026-11-25T23:00:00Z"}'

# Simular ambiente vacío
docker compose exec mqtt mosquitto_pub -t lab/camera/events -m '{"device_id":"robotica-camera-01","event_id":"evt-test-01","event_type":"presence_cleared","timestamp":"2026-11-25T23:06:00Z"}'
```
