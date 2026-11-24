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
