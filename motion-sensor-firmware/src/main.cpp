#include "constants.h"
#include "display_manager.h"
#include "hardware_init.h"
#include "storage_manager.h"
#include <Arduino.h>

StorageManager storageManager;
DisplayManager displayManager;

void setup()
{
    Serial.begin(115200);
    initHardware(
        Pins::LED,
        Pins::BUTTON,
        Pins::SENSOR,
        Pins::RELAY,
        Pins::SDA,
        Pins::SCL,
        Display::SCREEN_I2C_ADDRESS);

    displayManager.showStartupScreen(storageManager.hasWiFiCredentials());
}

void loop()
{
}
