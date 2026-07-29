#include "display_manager.h"
#include <Arduino.h>

DisplayManager::DisplayManager(Adafruit_SSD1306 &displayInstance)
    : display(displayInstance) {}

void DisplayManager::renderCenteredMessage(const char *firstLine,
                                           const char *secondLine) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  int16_t x1, y1;
  uint16_t w1 = 0, h1 = 0;
  uint16_t w2 = 0, h2 = 0;

  if (firstLine != nullptr) {
    display.getTextBounds(firstLine, 0, 0, &x1, &y1, &w1, &h1);
  }
  if (secondLine != nullptr) {
    display.getTextBounds(secondLine, 0, 0, &x1, &y1, &w2, &h2);
  }

  uint16_t screenWidth = display.width();
  uint16_t screenHeight = display.height();

  uint16_t spacing = (firstLine && secondLine) ? 4 : 0;
  uint16_t totalHeight = h1 + h2 + spacing;

  int16_t startY = (screenHeight - totalHeight) / 2;

  if (firstLine != nullptr) {
    int16_t x = (screenWidth - w1) / 2;
    display.setCursor(x < 0 ? 0 : x, startY);
    display.println(firstLine);
  }

  if (secondLine != nullptr) {
    int16_t x = (screenWidth - w2) / 2;
    int16_t y = startY + h1 + spacing;
    display.setCursor(x < 0 ? 0 : x, y);
    display.println(secondLine);
  }

  display.display();
}