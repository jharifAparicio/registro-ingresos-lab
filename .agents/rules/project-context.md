# Contexto del Proyecto: Registro de Ingresos - Laboratorio de Robótica

## Arquitectura
- **Nodo de captura:** ESP32-CAM (OV2640 + PIR HC-SR501), publica eventos por MQTT (`1883`) y expone flujo MJPEG por HTTP.
- **Servidor Dockerizado:**
  - `nginx` (`:80`): Proxy inverso único (`/` -> Astro, `/api/` -> NestJS).
  - `mqtt` (`:1883`): Eclipse Mosquitto.
  - `db`: PostgreSQL 16 (solo red interna).
  - `backend`: NestJS + TypeScript + FFmpeg + Argon2 + JWT (solo red interna).
  - `frontend`: Astro + Tailwind CSS (solo red interna).

## Estilo de Código (Estándar tipo midudev)
- Sin punto y coma (`semi: false`).
- Comillas simples (`singleQuote: true`).
- Indentación de 2 espacios (`tabWidth: 2`).
- Sin comas finales (`trailingComma: "none"`).
- Nombres claros en inglés para código/variables; UI y documentación en español.

## Comandos Docker
- **Desarrollo:** `docker compose up -d --build`
- **Producción:** `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`

## Git Hooks (Husky)
- Activar una sola vez al clonar: `git config core.hooksPath .husky`
- Ramas permitidas: `main`, `develop`, o `feat|fix|chore|docs|refactor|test|ci/<nombre>`
- Commits: **Conventional Commits** (ej. `feat(backend): agregar login`)
- `pre-commit` ejecuta los tests del backend antes de permitir el commit.
