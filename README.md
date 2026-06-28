# Motion Sensor System

Motion Sensor System with a Swift iOS app, a Python FastAPI backend, and ESP32 firmware.

## Projects

| Folder | What it is |
|---|---|
| [motion-sensor-app](motion-sensor-app/) | iOS app (Swift) |
| [motion-sensor-be](motion-sensor-be/) | Backend API: FastAPI + PostgreSQL (SQLAlchemy + Alembic) + MQTT |
| [motion-sensor-firmware](motion-sensor-firmware/) | ESP32 firmware (PlatformIO) |

**Docker is the default way to run this project.** The backend, Postgres, and the MQTT broker all run as containers via `docker-compose.yml` — you should not need to install Python, Postgres, or Mosquitto locally for normal development.

## Setup (Docker)

### Prerequisites

- Docker & Docker Compose
- pnpm (optional — only used as a thin script runner around `docker compose`)

### 1. Configure environment variables

```bash
cp .env.example .env
```

`.env` holds every DB/MQTT/port value the stack needs (`POSTGRES_DB`, `POSTGRES_USER`, `MQTT_BROKER_HOST`, etc.) — see [.env.example](.env.example) for the full list and what each one controls. `docker compose` loads it automatically; nothing else to configure. The defaults work out of the box for local dev.

### 2. Start everything

```bash
pnpm run docker:up
# or: docker compose up -d
```

This starts five containers:
- **PostgreSQL** — `localhost:${POSTGRES_HOST_PORT}` (default `5432`)
- **Mosquitto (MQTT)** — `localhost:${MQTT_HOST_PORT}` (default `1883`)
- **Redis** — `localhost:${REDIS_HOST_PORT}` (default `6379`), Celery's broker
- **Backend API** — `http://localhost:${BACKEND_HOST_PORT}` (default `8080`)
- **Celery worker** — sends queued emails, no exposed port

Emails need a real `RESEND_API_KEY` in `.env` to actually deliver (get one at https://resend.com/api-keys) — without it, the worker will retry and log the auth error instead of crashing.

Alembic migrations run automatically on startup (see `motion-sensor-be/Dockerfile`'s `CMD`) — the database schema is always up to date with no manual SQL.

The backend container mounts `motion-sensor-be/` as a live volume and runs uvicorn with `--reload`, so editing Python source on your host restarts the server inside the container automatically — no rebuild needed. You only need `docker compose build` again when you change `requirements.txt` or the `Dockerfile`.

### 3. Verify it's running

```bash
curl http://localhost:8080/health
# {"status":"ok","service":"motion-sensor-backend","database":"connected","mqtt":"connected"}
```

FastAPI also gives you interactive API docs for free at http://localhost:8080/docs.

### Other commands

```bash
pnpm run docker:logs                     # tail logs from all services
pnpm run docker:generate "add a column"  # generate a migration from your models (note: no `--`, see below)
pnpm run docker:migrate                  # apply pending migrations to the running stack
pnpm run docker:down                     # stop everything
```

> `docker:generate` takes the migration message as a plain extra argument — run it as `pnpm run docker:generate "message"`, **not** `pnpm run docker:generate -- "message"`. Unlike npm, pnpm forwards a literal `--` straight into the command, which breaks Alembic's `-m` flag.

---

## motion-sensor-app (iOS)

```bash
cd motion-sensor-app
open MotionSensorApp.xcodeproj
```

Point the app's API base URL at `http://localhost:8080` (or your machine's LAN IP if testing on a physical device, since `localhost` won't resolve to your Mac from an iPhone).

## motion-sensor-be (Backend)

FastAPI + SQLAlchemy + Alembic, talking to Postgres and the MQTT broker. Always run it via Docker (see [Setup](#setup-docker) above) unless you have a specific reason not to.

Layered structure, request flows top to bottom:
```
app/
├── routers/       # HTTP layer — request/response, no business logic
├── services/      # business logic — orchestrates repositories + MQTT
├── repositories/   # data access — raw DB queries, nothing else
├── models/         # SQLAlchemy ORM — what's actually in Postgres
├── schemas/        # Pydantic — request/response JSON shapes
├── core/           # shared infra: database.py (engine/session), mqtt_client.py, mailer.py (Resend), templates.py (Jinja2), celery_app.py
├── tasks/          # Celery tasks (e.g. sending queued emails)
└── main.py         # app instance, lifespan, router registration
```

**Email**: registering a device queues a welcome email via Celery/Redis (`app/tasks/email_tasks.py`) instead of sending inline — the HTTP request returns immediately, and a separate worker container picks the task up from Redis and sends it through [Resend](https://resend.com). Templates are plain HTML/CSS in `app/templates/` (Jinja2 for `{{ variables }}`, [premailer](https://github.com/peterbe/premailer) inlines the CSS at send-time since most email clients ignore `<style>` blocks) — no Node.js/MJML toolchain involved.

Changing a template or task doesn't need a rebuild (same bind-mounted volume as the API), but the worker has no live-reload like uvicorn does — run `docker compose restart motion-sensor-worker` after editing anything under `app/tasks/` or `app/templates/`.

**API Endpoints:**
- `GET /health` - Service health
- `GET /api/devices` - List devices
- `POST /api/devices/register` - Register device
- `GET /api/motion/{device_id}` - Latest motion
- `GET /api/motion/{device_id}/history` - Motion history
- `POST /api/motion/report` - Report motion event

**Schema changes:** edit the relevant model in `motion-sensor-be/app/models/`, then generate and apply a migration.

Against the running Docker stack (the default path):
```bash
pnpm run docker:generate "describe your change"
pnpm run docker:migrate
```

Or locally against `motion-sensor-be/`:
```bash
cd motion-sensor-be
alembic revision --autogenerate -m "describe your change"
alembic upgrade head
```

<details>
<summary>Running locally without Docker (advanced, not the default path)</summary>

```bash
cd motion-sensor-be
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/motion_sensor
export MQTT_BROKER_HOST=localhost
export MQTT_BROKER_PORT=1883
alembic upgrade head
uvicorn app.main:app --reload --port 8080
```
This still needs Postgres and Mosquitto reachable somewhere (e.g. leave those two running via `docker compose up postgres mosquitto`).
</details>

## motion-sensor-firmware (ESP32)

```bash
cd motion-sensor-firmware
platformio run -t upload
platformio device monitor
```

Point the firmware's MQTT broker address at your machine's LAN IP and the port from `MQTT_HOST_PORT` in `.env` (default `1883`) — the ESP32 is a separate physical device on your network, so it can't reach `localhost`.
