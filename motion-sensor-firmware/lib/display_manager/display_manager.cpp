#include "display_manager.h"

#include "hardware_init.h"
#include <Arduino.h>

namespace
{
void renderCenteredMessage(const char *firstLine, const char *secondLine)
{
	deviceDisplay.clearDisplay();
	deviceDisplay.setTextSize(1);
	deviceDisplay.setTextColor(SSD1306_WHITE);

	deviceDisplay.setCursor(0, 18);
	deviceDisplay.println(firstLine);

	if (secondLine != nullptr)
	{
		deviceDisplay.setCursor(0, 34);
		deviceDisplay.println(secondLine);
	}

	deviceDisplay.display();
}
} // namespace

void DisplayManager::showStartupScreen(bool hasWiFiCredentials)
{
	if (hasWiFiCredentials)
	{
		renderCenteredMessage("WiFi saved", "Ready to connect");
		return;
	}

	renderCenteredMessage("No WiFi saved", "Start setup mode");
}