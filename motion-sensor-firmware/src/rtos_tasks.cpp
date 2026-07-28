#include "rtos_tasks.h"
#include "constants.h"
#include "hardware_init.h"
#include <Arduino.h>

QueueHandle_t systemEventQueue = nullptr;
QueueHandle_t displayQueue = nullptr;

void vSensorTask(void *pvParameters)
{
    pinMode(Pins::SENSOR, INPUT);
    pinMode(Pins::BUTTON, INPUT_PULLUP);

    bool lastSensorState = false;
    bool lastButtonState = HIGH;
    uint32_t lastDebounceTime = 0;

    for (;;)
    {
        // 1. Read Motion Sensor
        bool currentSensorState = digitalRead(Pins::SENSOR) == HIGH;
        if (currentSensorState != lastSensorState)
        {
            lastSensorState = currentSensorState;
            SystemEvent event{
                .type = currentSensorState ? EventType::MOTION_DETECTED : EventType::MOTION_CLEARED,
                .timestampMs = millis(),
                .data = currentSensorState ? 1 : 0
            };
            xQueueSend(systemEventQueue, &event, 0);

            // Update display via command queue
            DisplayCommand cmd;
            cmd.mode = DisplayMode::STATUS_TEXT;
            snprintf(cmd.line1, sizeof(cmd.line1), "Motion:");
            snprintf(cmd.line2, sizeof(cmd.line2), currentSensorState ? "DETECTED" : "CLEAR");
            xQueueSend(displayQueue, &cmd, 0);
        }

        // 2. Read Button with debounce
        bool buttonReading = digitalRead(Pins::BUTTON);
        if (buttonReading != lastButtonState)
        {
            lastDebounceTime = millis();
            lastButtonState = buttonReading;
        }

        if ((millis() - lastDebounceTime) > 50)
        {
            if (buttonReading == LOW)
            {
                // Button Pressed
                SystemEvent event{
                    .type = EventType::BUTTON_PRESSED,
                    .timestampMs = millis(),
                    .data = 1
                };
                xQueueSend(systemEventQueue, &event, 0);
            }
        }

        vTaskDelay(pdMS_TO_TICKS(50));
    }
}

void vDisplayTask(void *pvParameters)
{
    DisplayCommand cmd;

    for (;;)
    {
        if (xQueueReceive(displayQueue, &cmd, portMAX_DELAY) == pdTRUE)
        {
            deviceDisplay.clearDisplay();
            deviceDisplay.setTextSize(1);
            deviceDisplay.setTextColor(SSD1306_WHITE);
            deviceDisplay.setCursor(0, 0);
            deviceDisplay.println(cmd.line1);
            deviceDisplay.println(cmd.line2);
            deviceDisplay.display();
        }
    }
}

void initRTOSTasks()
{
    systemEventQueue = xQueueCreate(10, sizeof(SystemEvent));
    displayQueue = xQueueCreate(10, sizeof(DisplayCommand));

    xTaskCreatePinnedToCore(
        vSensorTask,
        "SensorTask",
        4096,
        nullptr,
        2, // Priority
        nullptr,
        1  // Core 1
    );

    xTaskCreatePinnedToCore(
        vDisplayTask,
        "DisplayTask",
        4096,
        nullptr,
        1, // Priority
        nullptr,
        1  // Core 1
    );
}
