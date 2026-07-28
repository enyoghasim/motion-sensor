#include "constants.h"
#include "hardware_init.h"
#include "rtos_tasks.h"
#include <Arduino.h>

void setup()
{
    Serial.begin(115200);
    Serial.println("[SYSTEM] Initializing Hardware...");

    initHardware(
        Pins::LED,
        Pins::BUTTON,
        Pins::SENSOR,
        Pins::RELAY,
        Pins::SDA,
        Pins::SCL,
        Display::SCREEN_I2C_ADDRESS);

    Serial.println("[SYSTEM] Initializing FreeRTOS Tasks...");
    initRTOSTasks();

    // Send initial boot display message
    DisplayCommand bootCmd;
    bootCmd.mode = DisplayMode::STATUS_TEXT;
    snprintf(bootCmd.line1, sizeof(bootCmd.line1), "Motion Sensor");
    snprintf(bootCmd.line2, sizeof(bootCmd.line2), "RTOS Ready");
    xQueueSend(displayQueue, &bootCmd, 0);

    Serial.println("[SYSTEM] Setup complete.");
}

void loop()
{
    // FreeRTOS handles task execution. Delete Arduino loop task to free memory.
    vTaskDelete(NULL);
}