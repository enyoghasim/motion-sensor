#pragma once
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <cstdint>

extern Adafruit_SSD1306 deviceDisplay;

void initHardware(
    uint8_t ledPin,
    uint8_t buttonPin,
    uint8_t sensorPin,
    uint8_t relayPin,
    uint8_t sdaPin,
    uint8_t sclPin,
    uint8_t i2cAddress);

void showSpinner(uint8_t screenWidth, uint8_t screenHeight);