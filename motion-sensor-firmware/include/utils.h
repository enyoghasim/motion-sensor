#pragma once

#include <cstddef>
#include <cstring>

namespace Utils {
inline bool isNullTerminated(const char *value, size_t maxLength) {
  return memchr(value, '\0', maxLength) != nullptr;
}
} // namespace Utils