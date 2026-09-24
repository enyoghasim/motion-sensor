#include "ble_manager.h"
#include <Arduino.h>
#include <Ed25519.h>
#include <WiFi.h>
#include <algorithm>
#include <cstdio>
#include <cstring>
#include <esp_coexist.h>
#include <esp_system.h>
#include <vector>

namespace {
constexpr char SERVICE_UUID[] = "6b3e5a10-3f2c-4a4e-9d0e-1a2b3c4d5e6f";
constexpr char SSID_CHAR_UUID[] = "6b3e5a11-3f2c-4a4e-9d0e-1a2b3c4d5e6f";
constexpr char STATUS_CHAR_UUID[] = "6b3e5a12-3f2c-4a4e-9d0e-1a2b3c4d5e6f";
constexpr char PASSWORD_CHAR_UUID[] = "6b3e5a13-3f2c-4a4e-9d0e-1a2b3c4d5e6f";
constexpr char FACTORY_MAC_CHAR_UUID[] = "6b3e5a14-3f2c-4a4e-9d0e-1a2b3c4d5e6f";
constexpr char PUBLIC_KEY_CHAR_UUID[] = "6b3e5a15-3f2c-4a4e-9d0e-1a2b3c4d5e6f";
constexpr char CLAIM_CHALLENGE_CHAR_UUID[] = "6b3e5a16-3f2c-4a4e-9d0e-1a2b3c4d5e6f";
constexpr char CLAIM_SIGNATURE_CHAR_UUID[] = "6b3e5a17-3f2c-4a4e-9d0e-1a2b3c4d5e6f";
constexpr char WIFI_SCAN_CHAR_UUID[] = "6b3e5a18-3f2c-4a4e-9d0e-1a2b3c4d5e6f";
constexpr char CHUNK_TERMINATOR[] = "\n";

// Matches what a phone WiFi picker would show anyway -- the strongest
// networks in range, not every SSID the radio can hear.
constexpr size_t MAX_WIFI_SCAN_RESULTS = 10;

// Set on wifiScanChar while a scan is running; the app polls with plain
// reads and treats any other value as "the results are ready" (never
// collides with a real "ssid,rssi,secure\n..." result string).
constexpr char WIFI_SCAN_PENDING_MARKER[] = "SCANNING";

// Set on scan failure (after retries) -- distinct from WIFI_SCAN_PENDING_MARKER
// and from a real empty-results success, so the app can surface an actual
// error instead of a misleadingly empty network list.
constexpr char WIFI_SCAN_FAILED_MARKER[] = "FAILED";

struct WifiScanResult {
  std::string ssid;
  int32_t rssi;
  bool secure;
};
} // namespace

BleManager::FieldCallback::FieldCallback(BleManager &owner, std::string &buffer,
                                         bool &receivedFlag,
                                         const char *fieldLabel)
    : owner(owner), buffer(buffer), receivedFlag(receivedFlag),
      fieldLabel(fieldLabel) {}

void BleManager::FieldCallback::onWrite(NimBLECharacteristic *characteristic) {
  std::string chunk = characteristic->getValue();

  Serial.printf("[BLE] %s chunk received (%d bytes): ", this->fieldLabel,
                chunk.length());
  for (unsigned char c : chunk) {
    Serial.printf("%02X ", c);
  }
  Serial.println();

  if (chunk == CHUNK_TERMINATOR) {
    Serial.printf("[BLE] %s terminator matched\n", this->fieldLabel);
    this->receivedFlag = true;
    this->owner.trySaveCredentials();
    return;
  }

  this->buffer += chunk;

  char progress[32];
  snprintf(progress, sizeof(progress), "%s: %d bytes", this->fieldLabel,
           this->buffer.length());
  this->owner.displayManager.renderCenteredMessage("BLE: receiving creds",
                                                    progress);
}

BleManager::ClaimChallengeCallback::ClaimChallengeCallback(BleManager &owner)
    : owner(owner) {}

void BleManager::ClaimChallengeCallback::onWrite(
    NimBLECharacteristic *characteristic) {
  std::string chunk = characteristic->getValue();

  // The 64-char hex challenge can exceed a single ATT write (default MTU
  // only guarantees 20 usable bytes), so this accumulates chunks the same
  // way FieldCallback does for SSID/password, until the "\n" terminator.
  if (chunk == CHUNK_TERMINATOR) {
    Serial.printf("[BLE] claim challenge received (%d bytes)\n",
                  this->owner.challengeBuffer.length());
    // Defer the actual signing to loop() (see loopSignChallenge) instead of
    // running Ed25519::sign() here on NimBLE's host task.
    this->owner.pendingChallenge = this->owner.challengeBuffer;
    this->owner.challengeBuffer.clear();
    this->owner.challengeSignPending = true;
    return;
  }

  this->owner.challengeBuffer += chunk;
}

BleManager::WifiScanTriggerCallback::WifiScanTriggerCallback(BleManager &owner)
    : owner(owner) {}

void BleManager::WifiScanTriggerCallback::onWrite(
    NimBLECharacteristic *characteristic) {
  if (this->owner.wifiScanPending || this->owner.wifiScanRequested) {
    Serial.println("[BLE] wifi scan already running, ignoring request");
    return;
  }

  Serial.println("[BLE] wifi scan requested");
  // Actually starting the scan (WiFi.mode + WiFi.scanNetworks) is deferred
  // to loopWifiScan() -- calling WiFi APIs directly from this callback (on
  // NimBLE's host task, mid-connection) was returning WIFI_SCAN_FAILED
  // near-instantly rather than actually scanning, most likely a radio
  // coexistence/task-context issue. Same fix shape as signChallenge().
  this->owner.wifiScanRequested = true;
}

BleManager::PairingCallbacks::PairingCallbacks(BleManager &owner)
    : owner(owner) {}

uint32_t BleManager::PairingCallbacks::onPassKeyRequest() {
  uint32_t passkey = esp_random() % 1000000;

  char passkeyText[7];
  snprintf(passkeyText, sizeof(passkeyText), "%06u", passkey);
  Serial.printf("[BLE] pairing passkey: %s\n", passkeyText);
  this->owner.displayManager.renderCenteredMessage("Pairing code:",
                                                    passkeyText);

  return passkey;
}

void BleManager::PairingCallbacks::onAuthenticationComplete(
    ble_gap_conn_desc *desc) {
  if (desc->sec_state.encrypted) {
    Serial.println("[BLE] bonding succeeded, link encrypted");
    this->owner.displayManager.renderCenteredMessage("Paired", nullptr);
  } else {
    Serial.println("[BLE] bonding failed, link not encrypted");
    this->owner.displayManager.renderCenteredMessage("Pairing failed",
                                                      "try again");
  }
}

void BleManager::PairingCallbacks::onConnect(NimBLEServer *server,
                                             ble_gap_conn_desc *desc) {
  Serial.printf("[BLE] central connected, conn_handle=%d\n",
                desc->conn_handle);
  this->owner.displayManager.renderCenteredMessage("BLE: connected", nullptr);

  // Don't wait for the central to reactively pair after hitting an
  // encryption-required characteristic -- request it ourselves right away.
  // Some centrals (observed: iOS never showing the passkey prompt at all,
  // just failing reads indefinitely) don't reliably trigger the reactive
  // flow for this peripheral.
  int rc = NimBLEDevice::startSecurity(desc->conn_handle);
  Serial.printf("[BLE] startSecurity rc=%d\n", rc);
}

void BleManager::PairingCallbacks::onDisconnect(NimBLEServer *server) {
  Serial.println("[BLE] central disconnected, resuming advertising");
  this->owner.displayManager.renderCenteredMessage("Open IOTX app to",
                                                    "configure device");
  NimBLEDevice::startAdvertising();
}

BleManager::BleManager(StorageManager &storage, DisplayManager &display)
    : storageManager(storage), displayManager(display) {}

void BleManager::loadOrGenerateKeypair() {
  if (!this->storageManager.loadEd25519PrivateKey(this->privateKey)) {
    // rweather/Crypto's own RNG class expects an AVR-style noise source to be
    // fed via RNG.begin()/RNG.loop(); esp_fill_random() is ESP32's own
    // hardware TRNG, so we seed the key directly with it instead.
    esp_fill_random(this->privateKey, sizeof(this->privateKey));
    this->storageManager.saveEd25519PrivateKey(this->privateKey);
    Serial.println("[BLE] generated new Ed25519 identity keypair");
  }

  Ed25519::derivePublicKey(this->publicKey, this->privateKey);
}

void BleManager::signChallenge(const std::string &challenge) {
  // Must match DeviceService.finish_claim's `(factory_mac + challenge).encode('utf-8')`.
  std::string message = this->factoryMac + challenge;

  uint8_t signature[64];
  Ed25519::sign(signature, this->privateKey, this->publicKey, message.data(),
                message.size());

  Serial.println("[BLE] claim challenge signed");
  this->displayManager.renderCenteredMessage("BLE: claim signed", nullptr);

  if (this->signatureChar != nullptr) {
    this->signatureChar->setValue(signature, sizeof(signature));
    // No notify(): this was the first point in this whole build -- across
    // many hardware test rounds -- where a notify()+read-back cycle on an
    // encrypted characteristic actually gets exercised, and it reliably
    // disconnects ~0.2-0.5s after notify() is called (ruled out: NimBLE
    // host task stack size, running signing on the host task vs loop()).
    // The app polls this value with plain reads instead, which are
    // already proven reliable, rather than depend on notify delivery.
  }
}

void BleManager::init(const char *deviceName) {
  this->loadOrGenerateKeypair();
  this->factoryMac = std::string(WiFi.macAddress().c_str());

  NimBLEDevice::init(deviceName);
  NimBLEDevice::setMTU(247);

  // Entering setup mode means this device isn't claimed/configured yet, so
  // any bond from a previous pairing attempt (a prior owner, a factory
  // reset, or -- during firmware development -- an earlier build with a
  // different GATT layout) is stale by definition. Starting clean avoids
  // the phone and device disagreeing about a bond the phone's OS may have
  // cached against a now-different characteristic set.
  NimBLEDevice::deleteAllBonds();

  // A random address (regenerated fresh each time setup mode is entered)
  // means a phone holding a stale bond for a *previous* address literally
  // cannot match it to this one -- there is no cached key to conflict with,
  // rather than relying on the phone's own (often inaccessible, no
  // "Forget This Device" UI for plain GATT peripherals on iOS) bond cache
  // being cleared correctly.
  NimBLEDevice::setOwnAddrType(BLE_OWN_ADDR_RANDOM, true /* NRPA */);

  // Bonding + MITM + Secure Connections, Display Only IO capability: this
  // device shows a passkey (see PairingCallbacks::onPassKeyRequest) that the
  // user enters on the phone's native pairing prompt, encrypting the link
  // before any WiFi/claim characteristic can be read or written.
  NimBLEDevice::setSecurityAuth(true, true, true);
  NimBLEDevice::setSecurityIOCap(BLE_HS_IO_DISPLAY_ONLY);

  NimBLEServer *server = NimBLEDevice::createServer();
  server->setCallbacks(new PairingCallbacks(*this));

  NimBLEService *service = server->createService(SERVICE_UUID);

  // NIMBLE_PROPERTY::*_ENC is a security *requirement* bit, separate from
  // the base READ/WRITE *capability* bit (BLE_GATT_CHR_F_READ_ENC =
  // 0x0200 vs BLE_GATT_CHR_F_READ = 0x0002 -- non-overlapping). Using only
  // the _ENC flag leaves the characteristic with no read/write permission
  // at all, which ATT correctly (if confusingly) rejects as "Read/Write
  // Not Permitted" (att=2/3) regardless of bonding state -- not an
  // authentication error, so it never prompted for pairing on its own.
  NimBLECharacteristic *ssidChar = service->createCharacteristic(
      SSID_CHAR_UUID, NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_ENC);
  ssidChar->setCallbacks(
      new FieldCallback(*this, this->ssidBuffer, this->ssidReceived, "SSID"));

  NimBLECharacteristic *passwordChar = service->createCharacteristic(
      PASSWORD_CHAR_UUID,
      NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_ENC);
  passwordChar->setCallbacks(new FieldCallback(
      *this, this->passwordBuffer, this->passwordReceived, "Password"));

  this->statusChar = service->createCharacteristic(
      STATUS_CHAR_UUID, NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::READ_ENC |
                             NIMBLE_PROPERTY::NOTIFY);
  // Empty until notifyStatus() runs -- the app polls this with plain reads
  // (see signatureChar's comment on why, same reasoning applies here).
  this->statusChar->setValue("");

  NimBLECharacteristic *factoryMacChar = service->createCharacteristic(
      FACTORY_MAC_CHAR_UUID,
      NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::READ_ENC);
  factoryMacChar->setValue(this->factoryMac);

  NimBLECharacteristic *publicKeyChar = service->createCharacteristic(
      PUBLIC_KEY_CHAR_UUID,
      NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::READ_ENC);
  publicKeyChar->setValue(this->publicKey, sizeof(this->publicKey));

  NimBLECharacteristic *challengeChar = service->createCharacteristic(
      CLAIM_CHALLENGE_CHAR_UUID,
      NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_ENC);
  challengeChar->setCallbacks(new ClaimChallengeCallback(*this));

  this->signatureChar = service->createCharacteristic(
      CLAIM_SIGNATURE_CHAR_UUID, NIMBLE_PROPERTY::READ |
                                     NIMBLE_PROPERTY::READ_ENC |
                                     NIMBLE_PROPERTY::NOTIFY);
  // Empty until signChallenge() runs -- the app polls this with plain
  // reads and treats an empty value as "not signed yet".
  this->signatureChar->setValue("");

  this->wifiScanChar = service->createCharacteristic(
      WIFI_SCAN_CHAR_UUID,
      NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_ENC |
          NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::READ_ENC |
          NIMBLE_PROPERTY::NOTIFY);
  this->wifiScanChar->setValue("");
  this->wifiScanChar->setCallbacks(new WifiScanTriggerCallback(*this));

  service->start();

  NimBLEAdvertising *advertising = NimBLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  // NimBLEAdvertising's singleton captures the GAP device name into its
  // advertising data once, at construction time -- don't rely on that
  // timing lining up with when the name was actually registered; set it
  // explicitly so the app's scan list shows "MotionSensor" reliably
  // instead of falling back to "Unknown device".
  advertising->setName(deviceName);
  advertising->start();

  Serial.printf("[BLE] setup mode advertising, factory_mac=%s\n",
                this->factoryMac.c_str());
}

void BleManager::notifyStatus(const char *status) {
  this->displayManager.renderCenteredMessage("BLE status:", status);

  if (this->statusChar == nullptr) {
    return;
  }

  this->statusChar->setValue(status);
  // No notify() -- see signatureChar's comment in init() for why.
}

void BleManager::trySaveCredentials() {
  if (!this->ssidReceived || !this->passwordReceived) {
    return;
  }

  Serial.printf("[BLE] both fields received, ssid=\"%s\" (%d) password=\"%s\" (%d)\n",
                this->ssidBuffer.c_str(), this->ssidBuffer.size(),
                this->passwordBuffer.c_str(), this->passwordBuffer.size());

  WiFiCredentials credentials{};
  bool tooLong = this->ssidBuffer.size() >= sizeof(credentials.ssid) ||
                 this->passwordBuffer.size() >= sizeof(credentials.password);

  if (!tooLong) {
    strncpy(credentials.ssid, this->ssidBuffer.c_str(),
             sizeof(credentials.ssid) - 1);
    credentials.ssid[sizeof(credentials.ssid) - 1] = '\0';

    strncpy(credentials.password, this->passwordBuffer.c_str(),
             sizeof(credentials.password) - 1);
    credentials.password[sizeof(credentials.password) - 1] = '\0';
  }

  this->ssidBuffer.clear();
  this->passwordBuffer.clear();
  this->ssidReceived = false;
  this->passwordReceived = false;

  if (tooLong) {
    Serial.println("[BLE] ssid or password too long for buffer");
    this->notifyStatus("error: credentials too long");
    return;
  }

  if (this->storageManager.saveWiFiCredentials(credentials)) {
    Serial.println("[BLE] saveWiFiCredentials succeeded, notifying \"saved\"");
    this->notifyStatus("saved");
  } else {
    Serial.println("[BLE] saveWiFiCredentials FAILED, notifying error");
    this->notifyStatus("error: save failed");
  }
}

void BleManager::completeWifiScan() {
  esp_coex_preference_set(ESP_COEX_PREFER_BALANCE);

  int16_t count = WiFi.scanComplete();

  std::vector<WifiScanResult> results;
  for (int16_t i = 0; i < count; i++) {
    std::string ssid(WiFi.SSID(i).c_str());
    if (ssid.empty()) {
      continue;
    }

    int32_t rssi = WiFi.RSSI(i);
    bool secure = WiFi.encryptionType(i) != WIFI_AUTH_OPEN;

    bool merged = false;
    for (auto &existing : results) {
      // Mesh/multi-AP networks broadcast the same SSID on several
      // channels; keep only the strongest one for each name.
      if (existing.ssid == ssid) {
        if (rssi > existing.rssi) {
          existing.rssi = rssi;
          existing.secure = secure;
        }
        merged = true;
        break;
      }
    }

    if (!merged) {
      results.push_back({ssid, rssi, secure});
    }
  }

  std::sort(results.begin(), results.end(),
            [](const WifiScanResult &a, const WifiScanResult &b) {
              return a.rssi > b.rssi;
            });

  if (results.size() > MAX_WIFI_SCAN_RESULTS) {
    results.resize(MAX_WIFI_SCAN_RESULTS);
  }

  Serial.printf("[BLE] wifi scan complete: %d networks\n",
                (int)results.size());

  // All results joined into one value ("ssid,rssi,secure\n..."), set once
  // no JSON, and no notify (see WIFI_SCAN_PENDING_MARKER's comment and
  // signChallenge's -- notify()+read-back on an encrypted characteristic
  // reliably disconnects the link). The app polls with plain reads and
  // decodes the whole list from a single read once it's no longer the
  // "still scanning" marker. Comfortably fits ATT's 512-byte max attribute
  // value at MAX_WIFI_SCAN_RESULTS networks.
  if (this->wifiScanChar != nullptr) {
    std::string joined;
    for (const auto &result : results) {
      joined += result.ssid + "," + std::to_string(result.rssi) + "," +
                (result.secure ? "1" : "0") + CHUNK_TERMINATOR;
    }
    this->wifiScanChar->setValue(joined);
  }

  WiFi.scanDelete();
  this->wifiScanPending = false;
}

void BleManager::startWifiScan() {
  this->wifiScanPending = true;
  if (this->wifiScanChar != nullptr) {
    this->wifiScanChar->setValue(WIFI_SCAN_PENDING_MARKER);
  }
  // Confirmed via isolated testing: scanning works fine standalone but
  // consistently fails while a BLE connection is held open -- WiFi/BT share
  // one radio, and the coexistence arbiter's default balance doesn't give
  // WiFi enough airtime to complete a scan against an active connection.
  // Temporarily biasing towards WiFi for the duration of the scan (restored
  // to balanced once it's done, in loopWifiScan) fixes that without
  // dropping the BLE connection the app is relying on to fetch the result.
  esp_coex_preference_set(ESP_COEX_PREFER_WIFI);
  WiFi.mode(WIFI_STA);
  WiFi.scanNetworks(true /* async */);
}

void BleManager::loopWifiScan() {
  if (this->wifiScanRequested && !this->wifiScanPending) {
    this->wifiScanRequested = false;
    // A couple of automatic retries as a safety net on top of the
    // ESP_COEX_PREFER_WIFI bias in startWifiScan(), in case of some other
    // transient stall -- cheap to try before giving up.
    this->wifiScanRetriesRemaining = 2;
    this->startWifiScan();
  }

  if (!this->wifiScanPending) {
    return;
  }

  int16_t status = WiFi.scanComplete();
  if (status == WIFI_SCAN_RUNNING) {
    return;
  }

  if (status == WIFI_SCAN_FAILED) {
    if (this->wifiScanRetriesRemaining > 0) {
      this->wifiScanRetriesRemaining--;
      Serial.printf("[BLE] wifi scan failed, retrying (%d left)\n",
                    this->wifiScanRetriesRemaining);
      this->startWifiScan();
      return;
    }

    Serial.println("[BLE] wifi scan failed");
    esp_coex_preference_set(ESP_COEX_PREFER_BALANCE);
    if (this->wifiScanChar != nullptr) {
      // Distinct from both WIFI_SCAN_PENDING_MARKER and a real "0 results"
      // success (empty string) -- the app needs to tell "scan failed" apart
      // from "scan succeeded, nothing nearby" rather than silently showing
      // an empty network list either way.
      this->wifiScanChar->setValue(WIFI_SCAN_FAILED_MARKER);
    }
    this->wifiScanPending = false;
    return;
  }

  this->completeWifiScan();
}

void BleManager::loopSignChallenge() {
  if (!this->challengeSignPending) {
    return;
  }

  std::string challenge = this->pendingChallenge;
  this->pendingChallenge.clear();
  this->challengeSignPending = false;

  this->signChallenge(challenge);
}
