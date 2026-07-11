# Oairing Motion Sensor Lifecycle

## Architecture

```text
+----------------+
| Mobile App     |
+----------------+
        │
        │ BLE
        ▼
+----------------+
| ESP32          |
| 0.9" OLED      |
+----------------+
        │
        │ HTTPS + MQTT
        ▼
+----------------+
| Oairing API    |
+----------------+
        │
        ▼
+----------------+
| PostgreSQL     |
+----------------+
```

---

# 1. First Boot (Never Paired)

When the user powers on the motion sensor for the very first time:

1. Read the factory MAC address from eFuse.
2. Generate an ECC (Ed25519 or P-256) public/private key pair.
3. Store the private key securely in NVS.
4. Keep the public key in memory.
5. Set:

```text
paired = false
```

6. Start BLE advertising.

### OLED

```text
Oairing

Ready to Pair

Hold Button
```

or

```text
Ready to Pair

Code: 4821
```

---

# 2. User Opens the App

```
Home
```

```
+ Add Device
```

User taps **Add Motion Sensor**.

---

# 3. BLE Discovery

The app scans for nearby Oairing devices.

Displays:

```text
Motion Sensor

MAC:
24:6F:28:AB:CD:EF

Status:
Ready
```

User selects the sensor.

---

# 4. Start Claim

App calls:

```http
POST /device/claim/start
```

Body:

```json
{
  "mac": "...",
  "jwt": "..."
}
```

Backend checks:

- Is the MAC already claimed?
- Is the user authenticated?

If available, backend returns:

```json
{
  "challenge": "...",
  "nonce": "...",
  "expires_in": 300
}
```

---

# 5. Send Challenge to ESP32

App sends over BLE:

```text
Challenge
Nonce
```

---

# 6. ESP32 Signs

ESP32 signs:

```text
Sign(challenge, privateKey)
```

Returns:

```text
Signature

Public Key
```

to the mobile app.

---

# 7. Finish Claim

App sends:

```http
POST /device/claim/finish
```

```json
{
  "mac": "...",
  "challenge": "...",
  "signature": "...",
  "public_key": "...",
  "jwt": "..."
}
```

Backend:

- Verifies signature.
- Stores:

```text
Factory MAC
Public Key
Owner
Created At
Device Type
```

Returns:

```text
Claim Successful
```

### OLED

```text
✓ Paired

Connecting...
```

---

# 8. Wi-Fi Setup

App asks user for:

- Wi-Fi SSID
- Password

Sends via BLE.

ESP32 stores:

- SSID
- Password

inside NVS.

OLED:

```text
Connecting...

Wi-Fi...
```

then

```text
Connected

192.168.x.x
```

---

# 9. Authenticate with Backend

ESP32 connects to Wi-Fi.

Calls:

```http
POST /auth/challenge
```

Body:

```json
{
  "mac": "..."
}
```

Backend returns:

```text
Random Challenge
```

ESP32:

- Signs challenge.
- Sends signature.

Backend:

- Verifies signature.
- Issues a device access token.

OLED:

```text
Online

✓
```

---

# 10. Normal Operation

When motion is detected:

ESP32 publishes:

```json
{
  "motion": true,
  "battery": 92,
  "temperature": 31,
  "timestamp": "..."
}
```

using MQTT.

Backend:

- Stores event.
- Sends push notification.
- Updates dashboard.

OLED:

```text
Motion

Detected
```

---

# 11. Device Restart

If power is lost:

ESP32 boots.

Reads from NVS:

- Private key
- Wi-Fi credentials
- Configuration

Automatically:

1. Connects to Wi-Fi.
2. Authenticates.
3. Connects to MQTT.

OLED:

```text
Reconnecting...
```

then

```text
Online
```

---

# 12. Change Wi-Fi

User holds the button for 5 seconds.

OLED:

```text
Setup Mode
```

BLE starts again.

Phone reconnects.

New Wi-Fi credentials are sent.

Done.

---

# 13. OTA Update

Backend checks:

```text
Current Version

Latest Version
```

If newer firmware exists:

- ESP32 downloads OTA.
- Installs firmware.
- Reboots.

The following remain unchanged:

- Private key
- Wi-Fi
- Ownership

---

# 14. Flash Erased

Someone runs:

```bash
esptool.py erase_flash
```

Everything is erased:

- Private key
- Wi-Fi
- Configuration

ESP32 boots.

Generates a new key pair.

Attempts to register.

Backend:

```text
MAC already owned
```

Registration rejected.

OLED:

```text
Already Registered

Open App
```

---

# 15. Recovery

Owner opens:

```
My Devices
```

↓

```
Motion Sensor
```

↓

```
Recover Device
```

Backend:

- Verifies password/MFA.
- Generates a recovery token (5 minutes).

App connects to ESP32 over BLE.

Sends:

```text
Recovery Token
```

ESP32:

- Signs token.
- Sends:

```text
MAC

New Public Key

Signature
```

Backend:

- Verifies token.
- Replaces old public key with the new one.

Ownership **does not change**.

OLED:

```text
Recovered

Restarting...
```

---

# 16. Selling or Transferring the Device

Current owner:

```
My Devices
```

↓

```
Remove Device
```

Backend:

- Removes owner.
- Deletes stored public key.
- Marks device as:

```text
Unclaimed
```

ESP32:

Factory reset.

New owner pairs normally.

---

# Suggested OLED Screens

## Boot

```text
Oairing

Booting...
```

---

## Ready to Pair

```text
Ready to Pair

Code: 4821
```

---

## Pairing

```text
Pairing...

██████░░░
```

---

## Connecting

```text
Connecting...

Wi-Fi
```

---

## Online

```text
Online

Wi-Fi ✓

Cloud ✓
```

---

## Motion

```text
Motion

Detected!
```

---

## Offline

```text
Offline

Retrying...
```

---

## OTA

```text
Updating...

68%
```

---

## Error

```text
Error

Open App
```

---

# Button Actions

| Action            | Behaviour                                                                      |
| ----------------- | ------------------------------------------------------------------------------ |
| Press (1 second)  | Show device information (MAC, firmware version, Wi-Fi status, IP address).     |
| Hold (5 seconds)  | Enter pairing/setup mode and enable BLE.                                       |
| Hold (10 seconds) | Factory reset (erase NVS and Wi-Fi only). Backend ownership remains unchanged. |
| Hold (15 seconds) | Factory reset with confirmation screen to prevent accidental reset.            |

---

# Database

## Devices

| Column           | Description                |
| ---------------- | -------------------------- |
| id               | Internal ID                |
| factory_mac      | Factory MAC address        |
| owner_id         | User who owns the device   |
| public_key       | Device public key          |
| status           | Claimed / Unclaimed        |
| firmware_version | Current firmware           |
| created_at       | Registration time          |
| updated_at       | Last update                |
| last_seen        | Last successful connection |

---

# NVS Contents

```text
Private Key
Wi-Fi SSID
Wi-Fi Password
Device Configuration
Pairing State
Firmware Settings
```

---

# Security Model

## Device Identity

Factory MAC (immutable).

## Authentication

ECC Public/Private Key Pair.

## Ownership

Managed entirely by the Oairing backend.

## Configuration

Stored locally in NVS.

## Communication

- BLE → Pairing and setup.
- HTTPS → Authentication.
- MQTT → Real-time events.

This architecture ensures that:

- Every physical ESP32 has a permanent identity.
- Only the device possessing the private key can authenticate.
- Factory resets do not transfer ownership.
- Owners can securely recover devices after accidental erasure.
- Devices can be transferred safely through an explicit ownership-release flow.
