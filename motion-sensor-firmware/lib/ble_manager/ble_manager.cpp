#include "ble_manager.h"
#include <Arduino.h>
#include <cstdio>
#include <cstring>

namespace {
constexpr char SERVICE_UUID[] = "6b3e5a10-3f2c-4a4e-9d0e-1a2b3c4d5e6f";
constexpr char CREDS_CHAR_UUID[] = "6b3e5a11-3f2c-4a4e-9d0e-1a2b3c4d5e6f";
constexpr char STATUS_CHAR_UUID[] = "6b3e5a12-3f2c-4a4e-9d0e-1a2b3c4d5e6f";
constexpr char CHUNK_TERMINATOR[] = "\n";
} // namespace

BleManager::CredsCallback::CredsCallback(BleManager &owner) : owner(owner) {}

void BleManager::CredsCallback::onWrite(NimBLECharacteristic *characteristic) {
  std::string chunk = characteristic->getValue();

  Serial.printf("[BLE] chunk received (%d bytes): ", chunk.length());
  for (unsigned char c : chunk) {
    Serial.printf("%02X ", c);
  }
  Serial.println();

  if (chunk == CHUNK_TERMINATOR) {
    Serial.println("[BLE] terminator matched, finalizing creds");
    this->owner.handleCredsComplete();
    return;
  }

  this->owner.credsBuffer += chunk;
  Serial.printf("[BLE] buffer now: \"%s\"\n", this->owner.credsBuffer.c_str());

  char progress[32];
  snprintf(progress, sizeof(progress), "%d bytes received",
           this->owner.credsBuffer.length());
  this->owner.displayManager.renderCenteredMessage("BLE: receiving creds",
                                                    progress);
}

BleManager::BleManager(StorageManager &storage, DisplayManager &display)
    : storageManager(storage), displayManager(display) {}

void BleManager::init(const char *deviceName) {
  NimBLEDevice::init(deviceName);
  NimBLEDevice::setMTU(247);

  NimBLEServer *server = NimBLEDevice::createServer();
  NimBLEService *service = server->createService(SERVICE_UUID);

  NimBLECharacteristic *credsChar =
      service->createCharacteristic(CREDS_CHAR_UUID, NIMBLE_PROPERTY::WRITE);
  credsChar->setCallbacks(new CredsCallback(*this));

  this->statusChar = service->createCharacteristic(
      STATUS_CHAR_UUID, NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);

  service->start();

  NimBLEAdvertising *advertising = NimBLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->start();
}

void BleManager::notifyStatus(const char *status) {
  this->displayManager.renderCenteredMessage("BLE status:", status);

  if (this->statusChar == nullptr) {
    return;
  }

  this->statusChar->setValue(status);
  this->statusChar->notify();
}

void BleManager::handleCredsComplete() {
  Serial.printf("[BLE] finalizing, raw buffer (%d bytes): \"%s\"\n",
                this->credsBuffer.length(), this->credsBuffer.c_str());

  size_t separatorIndex = this->credsBuffer.find(':');

  if (separatorIndex == std::string::npos) {
    Serial.println("[BLE] no ':' separator found");
    this->notifyStatus("error: malformed credentials");
    this->credsBuffer.clear();
    return;
  }

  std::string ssid = this->credsBuffer.substr(0, separatorIndex);
  std::string password = this->credsBuffer.substr(separatorIndex + 1);
  this->credsBuffer.clear();

  Serial.printf("[BLE] parsed ssid=\"%s\" (%d) password=\"%s\" (%d)\n",
                ssid.c_str(), ssid.size(), password.c_str(), password.size());

  WiFiCredentials credentials{};

  if (ssid.size() >= sizeof(credentials.ssid) ||
      password.size() >= sizeof(credentials.password)) {
    Serial.println("[BLE] ssid or password too long for buffer");
    this->notifyStatus("error: credentials too long");
    return;
  }

  strncpy(credentials.ssid, ssid.c_str(), sizeof(credentials.ssid) - 1);
  credentials.ssid[sizeof(credentials.ssid) - 1] = '\0';

  strncpy(credentials.password, password.c_str(), sizeof(credentials.password) - 1);
  credentials.password[sizeof(credentials.password) - 1] = '\0';

  if (this->storageManager.saveWiFiCredentials(credentials)) {
    Serial.println("[BLE] saveWiFiCredentials succeeded, notifying \"saved\"");
    this->notifyStatus("saved");
  } else {
    Serial.println("[BLE] saveWiFiCredentials FAILED, notifying error");
    this->notifyStatus("error: save failed");
  }
}
