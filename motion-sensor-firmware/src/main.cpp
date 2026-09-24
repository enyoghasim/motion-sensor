#include "ble_manager.h"
#include "constants.h"
#include "display_manager.h"
#include "hardware_init.h"
#include "storage_manager.h"
#include <Arduino.h>

StorageManager storageManager;
DisplayManager displayManager(deviceDisplay);
BleManager bleManager(storageManager, displayManager);
DeviceState::State DeviceState::currentState = DeviceState::State::BOOTING;

void setup() {
  Serial.begin(115200);

  DeviceState::setState(DeviceState::State::BOOTING);

  initHardware(Pins::LED, Pins::BUTTON, Pins::SENSOR, Pins::RELAY, Pins::SDA,
               Pins::SCL, Display::SCREEN_I2C_ADDRESS);

  displayManager.renderCenteredMessage("Booting...", nullptr);

  if (!storageManager.hasCreds()) {
    DeviceState::setState(DeviceState::State::SETUP_MODE);
    bleManager.init(Ble::DEVICE_NAME);
    displayManager.renderCenteredMessage("Open IOTX app to",
                                         "configure device");
  } else {
    DeviceState::setState(DeviceState::State::CONNECTING_TO_WIFI);
    displayManager.renderCenteredMessage("Connecting to WiFi...", nullptr);
  }
}

void loop() {
  bleManager.loopWifiScan();
  bleManager.loopSignChallenge();
}