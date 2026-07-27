# Motion Sensor Backend — Agent Guide

FastAPI backend for the motion sensor IoT product: user auth, spaces, ESP32 device pairing/auth, motion event ingestion (HTTP + MQTT), and an admin panel (SQLAdmin). Async SQLAlchemy 2.0 + Postgres, Redis (sessions/OTP/rate-limiting/device tokens), Celery (email), MQTT (paho) for device comms.

# Project structure & layering

```
app/
  main.py            FastAPI app assembly: lifespan (mqtt connect), exception handlers, SQLAdmin, router registration
  admin.py           SQLAdmin ModelView definitions
  core/              Cross-cutting infra: database, security, redis, mqtt, celery, rate_limit, mailer, templates, exception_handler
  routers/           HTTP endpoints ONLY. Parse request -> call a service -> wrap result in success_response(). No SQL, no business rules here.
  services/          Business logic. Depends on repositories (+ other services). This is where rules live (ownership checks, claim/pairing flow, rate-limit calls).
  repositories/      SQLAlchemy queries ONLY. One class per model, methods return models/None/lists. No HTTPException here — repositories don't know about HTTP.
  schemas/           Pydantic request/response models (one file per domain), re-exported through schemas/__init__.py
  models/            SQLAlchemy ORM models (one file per table), re-exported through models/__init__.py
  tasks/             Celery tasks (currently just email)
tests/               Pytest suite — see "Testing" below. This is where ALL new tests go.
alembic/             DB migrations
```

**Layering rule, strictly:** `router -> service -> repository`. A router must never import a repository directly, and a repository must never raise `HTTPException` (that's the service's job — it's the layer that knows about users/ownership/HTTP semantics). When adding a new router endpoint, always create the matching service method rather than putting logic inline in the route function, even for something that looks like a one-liner — this is what keeps the test suite able to unit-test business rules independent of HTTP.

Every router file follows the same shape: a module-level `get_x_service(db=Depends(get_db), ...)` provider function, then route functions that only take dependencies + a Pydantic request body and return `success_response(...)`.

# Response & error conventions

- Every success response goes through `success_response(message, data=None, meta=None)` from `app/utils/response.py`, producing `{ "success": true, "message": ..., "data": ... }`. Never return a raw dict or ORM object from a route — always go through this helper (or a `response_model=SuccessResponseModel[...]` schema).
- Errors are raised as `HTTPException(status_code=..., detail="...")` from services (or routers, for request-shape checks). Two global handlers in `core/exception_handler.py` convert these into the same envelope shape: `{ "success": false, "message", "errors" }`. Pydantic validation errors (422) get field-level `errors: [{ field, message }]` automatically — don't hand-roll validation error responses.
- Don't invent a new response shape for a new endpoint. If an endpoint doesn't fit `SuccessResponseModel[T]`, that's a signal to add a proper schema, not to return ad hoc JSON.

# Auth & session model

- Sessions are **opaque Redis-backed tokens**, not JWT: `create_session_token` (`core/security.py`) generates a random token, stores `session:{token} -> user_id` in Redis with a 30-day TTL. `get_current_user` looks the token up in Redis on every request. Logging out (`/auth/signout`) just deletes the Redis key.
- `get_current_user` (any authenticated user) vs `get_current_verified_user` (must also have `email_verified=True`) are separate FastAPI dependencies — **use `get_current_verified_user` for anything space/device/motion related**; the two exceptions are `/user/me` and the OTP/email-change endpoints themselves, which intentionally accept an unverified user (that's the whole point of email verification).
- Ownership is checked in the **service** layer by comparing `owner_id` to `current_user.id`, raising 403/404 as appropriate (see `SpaceService.update_space`, `DeviceService.delete_device`). Any new resource with an owner must follow this same not-found-then-not-owner check order (404 if the row doesn't exist at all, 403 if it exists but belongs to someone else).

# Rate limiting

`app/core/rate_limit.py` exposes `check_rate_limit(key, max_requests=5, window_seconds=600)` — a Redis `INCR` + `EXPIRE` fixed-window limiter that raises 429. **New auth-adjacent or otherwise abusable endpoints (OTP, password reset, anything unauthenticated or email-sending) must call this.** Note `app/routers/auth.py` currently has its own inline duplicate of this function predating the `core/rate_limit.py` extraction — when touching auth.py, prefer wiring it to the shared `core.rate_limit.check_rate_limit` rather than adding a third copy.

# Device pairing & device auth (ESP32)

Two distinct Ed25519 challenge-response flows, both backed by short-lived Redis keys — don't confuse them:
- **Claim** (`/api/devices/claim/start` -> `/api/devices/claim/finish`, user-authenticated): binds a `factory_mac` to the logged-in user by verifying a signature over `factory_mac + challenge` with the key the device presents. On success the device's `public_key` is persisted — this is the pairing/enrollment step, done once.
- **Device auth** (`schemas/mqtt.py` `DeviceAuthChallengeRequest/Response`, unauthenticated by user session): the already-paired device proves possession of its private key to get a short-lived opaque `device_token`, which the MQTT broker later validates via `/api/mqtt/auth`. Verification goes through `CryptoService.verify_ed25519_signature` — reuse it rather than re-implementing signature checks.
- The MQTT broker webhook (`/api/mqtt/auth`) is a device/broker-facing endpoint, not user-facing — it validates the opaque token issued by the device-auth flow above, not a user session token.

# Naming conventions

- Files: `snake_case.py`. One router/service/repository per resource, named after it (`space_service.py` <-> `SpaceService`, `device_repository.py` <-> `DeviceRepository`).
- Schemas: `<Domain>Out` for response shapes (`from_attributes=True` to read off ORM models directly), `<Domain>Create`/`<Domain>Update` for mutations, `<Domain>PaginatedResponse` = `{ items: list[...], next_cursor }` for cursor-paginated lists. Follow the cursor pattern (`created_at`/`timestamp` cursor + `limit+1` fetch-ahead trick, see `DeviceService.get_user_devices`) for any new paginated endpoint — don't introduce offset/page pagination.
- IDs: users/spaces are `int` PKs; devices/motion events reference devices by `uuid.UUID`. Don't mix these up in path params.

# Testing — compulsory, not optional

**Every feature endpoint must have tests.** No router change (new endpoint, changed status code, changed auth requirement, changed validation) merges without matching tests in `tests/`. This is a hard rule, not a suggestion — an endpoint without a test is treated as an incomplete PR.

Endpoints that gate on **auth, ownership, or verification status** (i.e. almost everything under `/api/*`, plus all of `/auth/*` and `/user/*`) need *detailed* coverage, not just a happy path. At minimum, for each such endpoint:
1. Happy path (200/201 with correct payload shape).
2. Missing/invalid/expired token -> 401.
3. Unverified user hitting a verified-only endpoint -> 403 (where applicable).
4. Wrong owner (resource exists but belongs to another user) -> 403.
5. Resource doesn't exist -> 404.
6. Invalid request body -> 422, with the specific field(s) asserted.
7. Rate-limited paths (OTP, password reset) -> confirm the 429 actually triggers after the configured max requests, and not before.

Public/device-facing endpoints (`/api/motion/report`, `/api/mqtt/auth`, `/health`) still need tests, just without the auth-matrix above — cover their actual failure modes instead (bad signature, unknown token, missing fields).

**Test layout & running:**
- All tests live under `tests/`, one file per router (`tests/test_auth.py`, `tests/test_spaces.py`, etc.), mirroring `app/routers/`.
- Run the suite with `pytest` from `motion-sensor-be/` (dev dependencies in `requirements-dev.txt`; install with `pip install -r requirements-dev.txt`).
- Tests are fully hermetic — no real Postgres, Redis, or MQTT broker required. `tests/conftest.py` swaps in an in-memory SQLite DB per test, a `fakeredis` instance patched into every module that imported `redis_client`, a stub MQTT client, and a no-op `EmailService`. **Never make a test depend on a real network service** — if a new module imports `redis_client` or `mqtt_client` directly, patch it in `conftest.py` the same way the existing ones are patched, don't add new infra requirements to the suite.
- Reuse the existing fixtures rather than rebuilding setup per file:
  - `client` — async `httpx.AsyncClient` wired to the app (DB/MQTT dependency overrides applied).
  - `db_session` — direct `AsyncSession` for seeding/asserting rows the API doesn't expose.
  - `make_user(email=..., password=..., name=..., verified=False)` — creates a `User` row directly (bypasses `/auth/signup` when a test just needs a user to exist).
  - `auth_headers(user)` — mints a real session token for a user via the same Redis-backed mechanism `create_session_token` uses, returns `{"Authorization": "Bearer ..."}`.
  - `fake_redis` — the actual `fakeredis` instance, for tests that need to assert/manipulate Redis state directly (e.g. an OTP hash, a rate-limit counter).
- The old root-level `test_auth.py` / `test_admin.py` were ad hoc manual scripts (no assertions, stale endpoint paths) and have been replaced by the real suite under `tests/` — don't resurrect that pattern.

# Commit & push

Once a change is done and the full suite passes (`pytest`, run from `motion-sensor-be/`), commit and push it. Scope the commit to `motion-sensor-be/` only; don't sweep in unrelated changes from `motion-sensor-app/` or `motion-sensor-firmware/`.
