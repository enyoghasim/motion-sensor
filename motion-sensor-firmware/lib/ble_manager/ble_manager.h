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
  std::string credsBuffer;

  class CredsCallback : public NimBLECharacteristicCallbacks {
  private:
    BleManager &owner;

  public:
    explicit CredsCallback(BleManager &owner);
    void onWrite(NimBLECharacteristic *characteristic) override;
  };

  void handleCredsComplete();

public:
  BleManager(StorageManager &storage, DisplayManager &display);

  void init(const char *deviceName);
  void notifyStatus(const char *status);
};
