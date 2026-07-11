#include "hardware_init.h"
#include "Wire.h"
#include <Arduino.h>

Adafruit_SSD1306 deviceDisplay(128, 64, &Wire, -1);

void showSpinner(uint8_t screenWidth, uint8_t screenHeight)
{
  int centerX = screenWidth / 2;
  int centerY = screenHeight / 2;
  int radius = 12;
  float angle = 0;

  for (int i = 0; i < 100; i++)
  {
    deviceDisplay.clearDisplay();
    deviceDisplay.drawCircle(centerX, centerY, radius, WHITE);

    int dotX = centerX + radius * cos(angle);
    int dotY = centerY + radius * sin(angle);

    deviceDisplay.fillCircle(dotX, dotY, 3, WHITE);
    deviceDisplay.display();

    angle += 0.2;
    delay(30);
  }
}

void initHardware(
    uint8_t ledPin,
    uint8_t buttonPin,
    uint8_t sensorPin,
    uint8_t relayPin,
    uint8_t sdaPin,
    uint8_t sclPin,
    uint8_t i2cAddress)
{
  pinMode(ledPin, OUTPUT);
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(sensorPin, INPUT);
  pinMode(relayPin, OUTPUT);

  Wire.begin(sdaPin, sclPin);

  digitalWrite(ledPin, LOW);
  digitalWrite(relayPin, LOW);

  if (!deviceDisplay.begin(SSD1306_SWITCHCAPVCC, i2cAddress))
  {
    for (;;)
      ;
  }

  deviceDisplay.clearDisplay();
  deviceDisplay.display();
}