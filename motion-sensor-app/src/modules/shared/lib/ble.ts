import { BleError, BleManager, Device, State } from "react-native-ble-plx";
import { PermissionsAndroid, Platform } from "react-native";

// Must match the UUIDs in motion-sensor-firmware/lib/ble_manager/ble_manager.cpp
export const MOTION_SENSOR_SERVICE_UUID =
  "6b3e5a10-3f2c-4a4e-9d0e-1a2b3c4d5e6f";
export const SSID_CHAR_UUID = "6b3e5a11-3f2c-4a4e-9d0e-1a2b3c4d5e6f";
export const STATUS_CHAR_UUID = "6b3e5a12-3f2c-4a4e-9d0e-1a2b3c4d5e6f";
export const PASSWORD_CHAR_UUID = "6b3e5a13-3f2c-4a4e-9d0e-1a2b3c4d5e6f";
export const FACTORY_MAC_CHAR_UUID = "6b3e5a14-3f2c-4a4e-9d0e-1a2b3c4d5e6f";
export const PUBLIC_KEY_CHAR_UUID = "6b3e5a15-3f2c-4a4e-9d0e-1a2b3c4d5e6f";
export const CLAIM_CHALLENGE_CHAR_UUID = "6b3e5a16-3f2c-4a4e-9d0e-1a2b3c4d5e6f";
export const CLAIM_SIGNATURE_CHAR_UUID = "6b3e5a17-3f2c-4a4e-9d0e-1a2b3c4d5e6f";
export const WIFI_SCAN_CHAR_UUID = "6b3e5a18-3f2c-4a4e-9d0e-1a2b3c4d5e6f";

// Must match BleManager's WIFI_SCAN_PENDING_MARKER -- the value wifiScanChar
// holds while a scan is running, so the poll knows to keep waiting.
export const WIFI_SCAN_PENDING_MARKER = "SCANNING";

// Must match BleManager's WIFI_SCAN_FAILED_MARKER -- distinct from both the
// pending marker and a real empty-results success, so a failed scan can be
// surfaced as an error instead of silently looking like "no networks found".
export const WIFI_SCAN_FAILED_MARKER = "FAILED";

// The chunked-write protocol the SSID/password characteristics expect: any
// number of value chunks, followed by a final write of exactly this string
// to signal "done" (see BleManager::FieldCallback in the firmware).
export const CHUNK_TERMINATOR = "\n";

let manager: BleManager | null = null;

export function getBleManager() {
  if (!manager) {
    manager = new BleManager();
  }

  return manager;
}

export async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return true;
  }

  if (Number(Platform.Version) >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);

    return Object.values(result).every(
      (status) => status === PermissionsAndroid.RESULTS.GRANTED,
    );
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

// The very first encrypted GATT operation after connecting is what the
// firmware's proactive NimBLEDevice::startSecurity() uses to kick off
// pairing, so this retry loop runs concurrently with -- not after -- the
// human actually reading the 6-digit passkey off the OLED and typing it
// into the phone's pairing prompt. Confirmed via firmware serial logs: the
// link does reach "bonding succeeded, link encrypted", just sometimes well
// into this window, so the budget has to comfortably outlast realistic
// passkey-entry time (could be 20-30s for someone reading a small screen),
// not just a brief stack-level race, or it'll misreport a still-in-progress
// pairing as a failure.
export async function retryDuringBonding<T>(
  operation: () => Promise<T>,
  attempts = 90,
  delayMs = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

// Rejects with `message` if `promise` hasn't settled within `ms`. Used
// around anything that waits on a BLE notify from the device -- without
// this, a firmware bug or a notify silently dropped mid-transit leaves the
// UI spinning forever with no error and no way out.
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

// react-native-ble-plx's BleError carries the real ATT/OS error code, but
// handleApiError() only ever surfaces error.message, which for a BleError
// is a generic platform-independent string (e.g. "Characteristic ... read
// failed"). Folding the actual codes into the message means a BLE failure
// can be diagnosed from what's shown in the UI/logs instead of guessed at.
export function describeBleError(error: unknown): unknown {
  if (!(error instanceof BleError)) {
    return error;
  }

  // error.message already includes the characteristic/service/device UUIDs
  // when relevant (see BleError's own message formatting) -- errorCode is
  // the one commonly-missing piece, e.g. distinguishing "OperationCancelled"
  // (an in-flight call got superseded/interrupted) from a real ATT/OS code.
  const details = [
    `code=${error.errorCode}`,
    error.attErrorCode !== null ? `att=${error.attErrorCode}` : null,
    error.iosErrorCode !== null ? `ios=${error.iosErrorCode}` : null,
    error.androidErrorCode !== null
      ? `android=${error.androidErrorCode}`
      : null,
    error.reason ? `reason=${error.reason}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return new Error(`${error.message} (${details})`);
}

// Plain reads have proven reliable throughout; notify()+read-back on an
// encrypted characteristic has not -- it reliably disconnects the link
// ~0.2-0.5s after the firmware calls notify(), for reasons that survived
// ruling out several theories (CCCD subscription timing, NimBLE host task
// stack size). Polling with reads sidesteps notify delivery entirely rather
// than depending on a mechanism that's demonstrably unreliable here.
export async function pollUntilReady(
  device: Device,
  characteristicUUID: string,
  isReady: (base64Value: string) => boolean,
  timeoutMs: number,
  intervalMs = 400,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const characteristic = await device.readCharacteristicForService(
      MOTION_SENSOR_SERVICE_UUID,
      characteristicUUID,
    );
    const value = characteristic.value ?? "";

    if (isReady(value)) {
      return value;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Timed out waiting for the device to respond.");
}

export function waitForPoweredOn(bleManager: BleManager): Promise<void> {
  return new Promise((resolve) => {
    const subscription = bleManager.onStateChange((state) => {
      if (state === State.PoweredOn) {
        subscription.remove();
        resolve();
      }
    }, true);
  });
}

// react-native-ble-plx reads/writes characteristic values as base64. The
// backend claim endpoints speak hex, and the firmware's factory_mac/challenge
// characteristics are plain ASCII — hand-rolled here so we don't need to pull
// in a Buffer/base64 polyfill just for a handful of small, fixed-size values.
const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function base64ToBytes(base64: string): number[] {
  const clean = base64.replace(/=+$/, "");
  const bytes: number[] = [];
  let buffer = 0;
  let bitsCollected = 0;

  for (const char of clean) {
    const value = BASE64_ALPHABET.indexOf(char);
    if (value === -1) continue;

    buffer = (buffer << 6) | value;
    bitsCollected += 6;

    if (bitsCollected >= 8) {
      bitsCollected -= 8;
      bytes.push((buffer >> bitsCollected) & 0xff);
    }
  }

  return bytes;
}

function bytesToBase64(bytes: number[]): string {
  let result = "";
  let i = 0;

  for (; i + 3 <= bytes.length; i += 3) {
    const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    result += BASE64_ALPHABET[(chunk >> 18) & 0x3f];
    result += BASE64_ALPHABET[(chunk >> 12) & 0x3f];
    result += BASE64_ALPHABET[(chunk >> 6) & 0x3f];
    result += BASE64_ALPHABET[chunk & 0x3f];
  }

  const remaining = bytes.length - i;
  if (remaining === 1) {
    const chunk = bytes[i] << 16;
    result += BASE64_ALPHABET[(chunk >> 18) & 0x3f];
    result += BASE64_ALPHABET[(chunk >> 12) & 0x3f];
    result += "==";
  } else if (remaining === 2) {
    const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8);
    result += BASE64_ALPHABET[(chunk >> 18) & 0x3f];
    result += BASE64_ALPHABET[(chunk >> 12) & 0x3f];
    result += BASE64_ALPHABET[(chunk >> 6) & 0x3f];
    result += "=";
  }

  return result;
}

export function base64ToHex(base64: string): string {
  return base64ToBytes(base64)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function base64ToAscii(base64: string): string {
  return base64ToBytes(base64)
    .map((byte) => String.fromCharCode(byte))
    .join("");
}

export function hexToBase64(hex: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytesToBase64(bytes);
}

export function asciiToBase64(ascii: string): string {
  return bytesToBase64(Array.from(ascii, (char) => char.charCodeAt(0)));
}

// A single BLE write is capped at (negotiated MTU - 3) bytes, and that
// negotiation is never guaranteed to succeed -- the unrequested default
// only guarantees 20 usable bytes. `device.mtu` reflects whatever was
// actually negotiated, so chunk against that rather than the firmware's
// preferred ceiling (NimBLEDevice::setMTU(247)) being reached.
function safeWriteChunkSize(device: Device): number {
  return device.mtu - 3;
}

// Writes a value in MTU-safe chunks followed by the terminator, matching
// the firmware's BleManager::FieldCallback/ClaimChallengeCallback protocol
// (SSID, password, claim challenge all use this).
export async function writeChunkedValue(
  device: Device,
  characteristicUUID: string,
  value: string,
): Promise<void> {
  const chunkSize = safeWriteChunkSize(device);

  for (let offset = 0; offset < value.length; offset += chunkSize) {
    await device.writeCharacteristicWithResponseForService(
      MOTION_SENSOR_SERVICE_UUID,
      characteristicUUID,
      asciiToBase64(value.slice(offset, offset + chunkSize)),
    );
  }

  await device.writeCharacteristicWithResponseForService(
    MOTION_SENSOR_SERVICE_UUID,
    characteristicUUID,
    asciiToBase64(CHUNK_TERMINATOR),
  );
}
