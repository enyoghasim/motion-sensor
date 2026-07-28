#pragma once

#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include <freertos/task.h>
#include <cstdint>

enum class EventType {
    MOTION_DETECTED,
    MOTION_CLEARED,
    BUTTON_PRESSED,
    SYSTEM_STATUS
};

struct SystemEvent {
    EventType type;
    uint32_t timestampMs;
    int data;
};

enum class DisplayMode {
    BOOT,
    IDLE,
    STATUS_TEXT,
    ANIMATION
};

struct DisplayCommand {
    DisplayMode mode;
    char line1[24];
    char line2[24];
};

// Global queue handles
extern QueueHandle_t systemEventQueue;
extern QueueHandle_t displayQueue;

// Task initialization
void initRTOSTasks();

// Task functions
void vSensorTask(void *pvParameters);
void vDisplayTask(void *pvParameters);
