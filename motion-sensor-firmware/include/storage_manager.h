#pragma once
#include "utils.h"
#include <Arduino.h>
#include <Preferences.h>

struct WiFiCredentials {
  char ssid[32];
  char password[64];
};

class StorageManager {
private:
  Preferences preferences;
  const char *NAMESPACE = "motion-sensor";

public:
  bool saveWiFiCredentials(const WiFiCredentials &credentials) {
    if (!Utils::isNullTerminated(credentials.ssid, sizeof(credentials.ssid))) {
      return false;
    }

    if (credentials.ssid[0] == '\0') {
      return false;
    }

    if (!Utils::isNullTerminated(credentials.password,
                                 sizeof(credentials.password))) {
      return false;
    }

    this->preferences.begin(this->NAMESPACE, false);

    bool success = this->preferences.putBytes("wifi", &credentials,
                                              sizeof(WiFiCredentials));
    this->preferences.end();
    return success;
  }

  WiFiCredentials loadWiFiCredentials() {

    WiFiCredentials credentials{};

    this->preferences.begin(this->NAMESPACE, true);

    size_t bytesRead = this->preferences.getBytes("wifi", &credentials,
                                                  sizeof(WiFiCredentials));
    this->preferences.end();

    if (bytesRead != sizeof(WiFiCredentials)) {
      return WiFiCredentials{};
    }

    return credentials;
  }

  bool clearWiFiCredentials() {
    this->preferences.begin(this->NAMESPACE, false);
    bool success = this->preferences.remove("wifi");
    this->preferences.end();
    return success;
  }

  bool hasWiFiCredentials() {
    this->preferences.begin(this->NAMESPACE, true);
    bool exists = this->preferences.isKey("wifi");
    this->preferences.end();
    return exists;
  }

  bool saveAccessToken(const char *accessToken) {
    if (!Utils::isNullTerminated(accessToken, 64)) {
      return false;
    }

    if (accessToken[0] == '\0') {
      return false;
    }

    this->preferences.begin(this->NAMESPACE, false);

    bool success = this->preferences.putString("access_token", accessToken);
    this->preferences.end();
    return success;
  }

  String loadAccessToken() {
    this->preferences.begin(this->NAMESPACE, true);

    String accessToken = this->preferences.getString("access_token", "");

    this->preferences.end();

    return accessToken;
  }

  bool clearAccessToken() {
    this->preferences.begin(this->NAMESPACE, false);
    bool success = this->preferences.remove("access_token");
    this->preferences.end();
    return success;
  }

  bool clearAll() {
    this->preferences.begin(this->NAMESPACE, false);
    bool success = this->preferences.clear();
    this->preferences.end();
    return success;
  }

  bool hasAccessToken() {
    this->preferences.begin(this->NAMESPACE, true);
    bool exists = this->preferences.isKey("access_token");
    this->preferences.end();
    return exists;
  }

  bool hasCreds() {
    return this->hasWiFiCredentials() && this->hasAccessToken();
  }

  bool saveEd25519PrivateKey(const uint8_t privateKey[32]) {
    this->preferences.begin(this->NAMESPACE, false);
    bool success = this->preferences.putBytes("ed25519_sk", privateKey, 32);
    this->preferences.end();
    return success;
  }

  bool loadEd25519PrivateKey(uint8_t privateKey[32]) {
    this->preferences.begin(this->NAMESPACE, true);
    size_t bytesRead = this->preferences.getBytes("ed25519_sk", privateKey, 32);
    this->preferences.end();
    return bytesRead == 32;
  }

  bool hasEd25519PrivateKey() {
    this->preferences.begin(this->NAMESPACE, true);
    bool exists = this->preferences.isKey("ed25519_sk");
    this->preferences.end();
    return exists;
  }
};