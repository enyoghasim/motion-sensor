#pragma once
#include <cstdint>

namespace Pins
{
    inline constexpr uint8_t LED = 13;
    inline constexpr uint8_t BUTTON = 18;
    inline constexpr uint8_t SCL = 33;
    inline constexpr uint8_t SDA = 32;
    inline constexpr uint8_t SENSOR = 27;
    inline constexpr uint8_t RELAY = 26;

}

namespace Display
{
    inline constexpr uint8_t SCREEN_WIDTH = 128;
    inline constexpr uint8_t SCREEN_HEIGHT = 64;
    inline constexpr uint8_t OLED_RESET = -1; // Reset pin # (or -1 if sharing Arduino reset pin)
    inline constexpr uint8_t SCREEN_I2C_ADDRESS = 0x3C;
}
