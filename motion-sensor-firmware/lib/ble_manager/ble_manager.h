#pragma once
#include "display_manager.h"
#include "storage_manager.h"
#include <NimBLEDevice.h>
#include <string>

class BleManager {
private:
  StorageManager &storageManager;
  DisplayManager &displayManager;
  NimBLECharacteristic *statusChar = nullptr;
  NimBLECharacteristic *signatureChar = nullptr;
  NimBLECharacteristic *wifiScanChar = nullptr;
  bool wifiScanRequested = false;
  bool wifiScanPending = false;
  uint8_t wifiScanRetriesRemaining = 0;

  std::string ssidBuffer;
  std::string passwordBuffer;
  bool ssidReceived = false;
  bool passwordReceived = false;

  std::string challengeBuffer;
  std::string pendingChallenge;
  bool challengeSignPending = false;

  std::string factoryMac;
  uint8_t privateKey[32] = {0};
  uint8_t publicKey[32] = {0};

  class FieldCallback : public NimBLECharacteristicCallbacks {
  private:
    BleManager &owner;
    std::string &buffer;
    bool &receivedFlag;
    const char *fieldLabel;

  public:
    FieldCallback(BleManager &owner, std::string &buffer, bool &receivedFlag,
                  const char *fieldLabel);
    void onWrite(NimBLECharacteristic *characteristic) override;
  };

  class ClaimChallengeCallback : public NimBLECharacteristicCallbacks {
  private:
    BleManager &owner;

  public:
    explicit ClaimChallengeCallback(BleManager &owner);
    void onWrite(NimBLECharacteristic *characteristic) override;
  };

  class WifiScanTriggerCallback : public NimBLECharacteristicCallbacks {
  private:
    BleManager &owner;

  public:
    explicit WifiScanTriggerCallback(BleManager &owner);
    void onWrite(NimBLECharacteristic *characteristic) override;
  };

  class PairingCallbacks : public NimBLEServerCallbacks {
  private:
    BleManager &owner;

  public:
    explicit PairingCallbacks(BleManager &owner);
    uint32_t onPassKeyRequest() override;
    void onAuthenticationComplete(ble_gap_conn_desc *desc) override;
    void onConnect(NimBLEServer *server, ble_gap_conn_desc *desc) override;
    void onDisconnect(NimBLEServer *server) override;
  };

  void trySaveCredentials();
  void loadOrGenerateKeypair();
  void signChallenge(const std::string &challenge);
  void completeWifiScan();
  void startWifiScan();

public:
  BleManager(StorageManager &storage, DisplayManager &display);

  void init(const char *deviceName);
  void notifyStatus(const char *status);

  // Call every loop() iteration; no-op unless a scan was requested over BLE.
  // Scanning is async (WiFi.scanNetworks(true)) and polled here rather than
  // blocked on in the write callback, per the "plain Arduino, no RTOS tasks"
  // architecture -- this is just polling inside the existing loop(), not a
  // new task/queue.
  void loopWifiScan();

  // Call every loop() iteration; no-op unless a challenge is waiting to be
  // signed. NimBLE's host task (where ClaimChallengeCallback::onWrite runs)
  // has only a 4096-byte stack (CONFIG_BT_NIMBLE_HOST_TASK_STACK_SIZE) --
  // too little headroom for Ed25519::sign()'s SHA-512 + EC point math on
  // top of the BLE stack's own usage. Deferring the actual signing to here
  // runs it on the main task's much larger stack instead.
  void loopSignChallenge();
};
