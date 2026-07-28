#include "constants.h"
#include "hardware_init.h"
#include <Arduino.h>

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

    // showSpinner(Display::SCREEN_WIDTH, Display::SCREEN_HEIGHT);
}

void loop()
{
    // deviceDisplay.clearDisplay();
    // deviceDisplay.setTextSize(1);
    // deviceDisplay.setTextColor(SSD1306_WHITE);
    // deviceDisplay.setCursor(0, 0);
    // deviceDisplay.println("Running.hh..");
    // deviceDisplay.display();
    // delay(1000);
}

//   deviceDisplay.clearDisplay();
//   deviceDisplay.setTextSize(1);
//   deviceDisplay.setTextColor(SSD1306_WHITE);
//   deviceDisplay.setCursor(0, 0);
//   deviceDisplay.println("OLED init OK");
//   deviceDisplay.println("Starting...");
//   deviceDisplay.display();