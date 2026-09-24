# Motion Sensor Firmware — Agent Guide

ESP32 firmware (`esp32doit-devkit-v1`, Arduino framework) for the motion sensor IoT product, built with PlatformIO. Currently: boot state machine, SSD1306 OLED status display, and NVS-backed storage for WiFi creds + access token. WiFi/BLE provisioning, MQTT publish, and motion-sensor reading are declared as dependencies but not wired up yet — `loop()` is still empty.

# Architecture — plain Arduino, not RTOS

`setup()`/`loop()` only. A FreeRTOS tasks/queues rewrite (`rtos_tasks.h/cpp`, event queues, `vSensorTask`/`vDisplayTask`) was tried and **reverted** — see git history (`5203ed5` then revert `6a41695`) and the current branch `firmware/no-rtos-baseline`. Don't reintroduce FreeRTOS tasks, queues, or multi-task architecture unless the user explicitly asks for it again; treat that as a deliberate, revisited decision, not an oversight.

# Project structure (PlatformIO layout)

```
include/            Shared headers used across the whole firmware, no matching .cpp required
  constants.h        Pin assignments, display geometry, and DeviceState (boot state machine) — nested namespaces, inline constexpr
  utils.h            Free helper functions (Utils namespace), currently just buffer validation
  storage_manager.h  StorageManager — header-only class wrapping ESP32 Preferences (NVS)
lib/                 Self-contained local "libraries" — one folder per component, each with paired .h + .cpp
  display_manager/   DisplayManager — owns rendering to the Adafruit_SSD1306 instance
  hardware_init/     initHardware() — pin modes, I2C bus, display bring-up; owns the global `deviceDisplay` instance
src/main.cpp         Entry point: setup()/loop(), wires the boot flow together
test/                PlatformIO unit-test placeholder — no tests exist yet (see Testing below)
```

`include/` vs `lib/` is a real distinction, not arbitrary: put a header-only or cross-cutting utility in `include/`; put anything with actual peripheral/behavioral logic (its own `.cpp`) in its own `lib/<name>/` folder, named after the component, exposing a small C-style init function or a single class.

# Conventions actually in use

- **Constants**: grouped by concern into `PascalCase` namespaces in `constants.h` (`Pins`, `Display`, `DeviceState`), members `inline constexpr` in `SCREAMING_SNAKE_CASE`. Add new pins/config the same way rather than scattering `#define`s or magic numbers in `.cpp` files.
- **Boot state machine**: `DeviceState::State` (enum class) + `extern State currentState` + `DeviceState::setState()`. It's intentionally minimal — no transition validation or listeners. If you add a new phase to the boot flow, add an enum value and call `setState()`; don't build a parallel status mechanism (e.g. a second bool flag or string status) alongside it.
- **Classes**: `PascalCase` type, `camelCase` methods, explicit `this->` on member access (see `StorageManager`) — follow whichever style the file you're editing already uses rather than normalizing across files.
- **Brace style is inconsistent between files** (`hardware_init.cpp` uses Allman, everything else uses K&R/same-line). Match the file you're editing; don't take this as license to reformat a file wholesale while making an unrelated change.
- **Validate before persisting**: `StorageManager` checks `Utils::isNullTerminated(...)` and non-empty before writing any buffer to NVS (see `saveWiFiCredentials`/`saveAccessToken`). Apply the same guard to any new persisted or externally-sourced fixed-size buffer.
- **`Preferences` usage**: every accessor pairs `preferences.begin(NAMESPACE, readOnly)` with `preferences.end()` around a single operation — don't hold a `begin()`/`end()` pair open across multiple calls or refactor this into a longer-lived session.
- **Headers**: `#pragma once` everywhere, C++17 (set via `build_unflags`/`build_flags` in `platformio.ini` — the framework's default is gnu++11, don't remove the override).
- Dead/commented-out code exists on purpose in a couple of spots (e.g. `// void showSpinner(...)` in `hardware_init.h`, the actual `showSpinner()` definition in `hardware_init.cpp` that's currently unused) — it's a parked feature, not stale cruft; don't delete it as a "cleanup" unless asked.

# Build, flash, verify

From `motion-sensor-firmware/` (PlatformIO CLI or the VS Code PlatformIO extension):
- Build: `pio run`
- Flash: `pio run -t upload`
- Serial monitor (115200 baud, matches `Serial.begin(115200)`): `pio device monitor`

There is no unit-test suite (`test/` is still the untouched PlatformIO placeholder). "Verified" for this subproject means: built, flashed to real hardware, and behavior confirmed on the device/serial monitor/OLED — not a green CI run. Follow the root [AGENTS.md](../AGENTS.md) rule: don't commit firmware changes until you've actually done that.

# Commit & push

Scope commits to `motion-sensor-firmware/` only — never sweep in `motion-sensor-app/` or `motion-sensor-be/` changes (see root [AGENTS.md](../AGENTS.md)). Only commit after the change has been flashed to real hardware and verified, not just compiled.
