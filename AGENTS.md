# Motion Sensor — Agent Guide

Monorepo for the Motion Sensor IoT product: three independent subprojects, each with its own toolchain, conventions, and its own `AGENTS.md`. This root file is a router, not a rulebook — figure out where the task lives, then go read (and follow) that subproject's `AGENTS.md` before touching any code. Don't apply one subproject's conventions to another; they're deliberately different stacks.

| Folder | Stack | Docs |
|---|---|---|
| [motion-sensor-app/](motion-sensor-app/) | Expo / React Native (TypeScript) mobile app | [motion-sensor-app/AGENTS.md](motion-sensor-app/AGENTS.md) |
| [motion-sensor-be/](motion-sensor-be/) | FastAPI + PostgreSQL + Redis + MQTT backend | [motion-sensor-be/AGENTS.md](motion-sensor-be/AGENTS.md) |
| [motion-sensor-firmware/](motion-sensor-firmware/) | ESP32 firmware (PlatformIO/Arduino) | no `AGENTS.md` yet — ask before assuming conventions |

If a task spans more than one subproject, treat it as separate work per subproject: read each subproject's `AGENTS.md` independently, and commit/push each one separately (see below) rather than mixing them into a single commit.

# Commit & push

Once a change in a subproject is done and verified working — test suite passing for `motion-sensor-be`, the app actually run/built for `motion-sensor-app`, firmware actually flashed/verified for `motion-sensor-firmware` — commit and push it.

Scope every commit to the single subproject you were working in: stage only the files under that subproject's folder, never `git add -A`/`git add .` across the whole repo. A task that touched two subprojects is two commits, not one.
