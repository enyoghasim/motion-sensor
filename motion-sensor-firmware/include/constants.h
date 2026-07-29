#pragma once
#include <cstdint>

namespace Pins {
inline constexpr uint8_t LED = 13;
inline constexpr uint8_t BUTTON = 18;
inline constexpr uint8_t SCL = 33;
inline constexpr uint8_t SDA = 32;
inline constexpr uint8_t SENSOR = 27;
inline constexpr uint8_t RELAY = 26;

} // namespace Pins

namespace Display {
inline constexpr uint8_t SCREEN_WIDTH = 128;
inline constexpr uint8_t SCREEN_HEIGHT = 64;
inline constexpr uint8_t OLED_RESET = -1;
inline constexpr uint8_t SCREEN_I2C_ADDRESS = 0x3C;
} // namespace Display

namespace Ble {
inline constexpr char DEVICE_NAME[] = "MotionSensor";
} // namespace Ble

namespace DeviceState {
enum class State : uint8_t {
  BOOTING,
  SETUP_MODE,
  CONNECTING_TO_WIFI,
  CONNECTED_TO_WIFI,
  CONNECTING_ERROR,
};

extern State currentState;

inline void setState(State newState) { currentState = newState; }

} // namespace DeviceState