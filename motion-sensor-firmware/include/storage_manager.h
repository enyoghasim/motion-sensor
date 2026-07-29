#pragma once
#include "utils.h"
#include <Preferences.h>

struct WiFiCredentials
{
    char ssid[32];
    char password[64];
};

class StorageManager
{
private:
    Preferences preferences;
    const char *NAMESPACE = "motion-sensor";

public:
    bool saveWiFiCredentials(const WiFiCredentials &credentials)
    {
        if (!Utils::isNullTerminated(credentials.ssid, sizeof(credentials.ssid)))
        {
            return false;
        }

        if (credentials.ssid[0] == '\0')
        {
            return false;
        }

        if (!Utils::isNullTerminated(credentials.password,
                                     sizeof(credentials.password)))
        {
            return false;
        }

        this->preferences.begin(this->NAMESPACE, false);

        bool success = this->preferences.putBytes("wifi", &credentials,
                                                  sizeof(WiFiCredentials));
        this->preferences.end();
        return success;
    }

    WiFiCredentials loadWiFiCredentials()
    {

        WiFiCredentials credentials{};

        this->preferences.begin(this->NAMESPACE, true);

        size_t bytesRead = this->preferences.getBytes("wifi", &credentials,
                                                      sizeof(WiFiCredentials));
        this->preferences.end();

        if (bytesRead != sizeof(WiFiCredentials))
        {
            return WiFiCredentials{};
        }

        return credentials;
    }

    bool clearWiFiCredentials()
    {
        this->preferences.begin(this->NAMESPACE, false);
        bool success = this->preferences.remove("wifi");
        this->preferences.end();
        return success;
    }
};