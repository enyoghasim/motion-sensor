#include <Adafruit_SSD1306.h>

class DisplayManager {
private:
  Adafruit_SSD1306 &display;

public:
  explicit DisplayManager(Adafruit_SSD1306 &displayInstance);

  void renderCenteredMessage(const char *firstLine, const char *secondLine);
};