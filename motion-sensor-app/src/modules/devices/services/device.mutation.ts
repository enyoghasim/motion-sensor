import { useMutation } from "@tanstack/react-query";
import { Device as BleDevice } from "react-native-ble-plx";
import api from "../../shared/lib/api";
import {
  asciiToBase64,
  CHUNK_TERMINATOR,
  CLAIM_CHALLENGE_CHAR_UUID,
  CLAIM_SIGNATURE_CHAR_UUID,
  FACTORY_MAC_CHAR_UUID,
  MOTION_SENSOR_SERVICE_UUID,
  PASSWORD_CHAR_UUID,
  PUBLIC_KEY_CHAR_UUID,
  SSID_CHAR_UUID,
  STATUS_CHAR_UUID,
  WIFI_SCAN_CHAR_UUID,
  WIFI_SCAN_FAILED_MARKER,
  WIFI_SCAN_PENDING_MARKER,
  base64ToAscii,
  base64ToHex,
  describeBleError,
  pollUntilReady,
  retryDuringBonding,
  writeChunkedValue,
} from "../../shared/lib/ble";
import { ApiError, handleApiError } from "../../shared/lib/util";
import { buildMutationOptions } from "../../shared/services/query-client";
import { deviceKeys } from "../../shared/services/query-keys";
import { WifiNetwork } from "../types";
import { DEVICE_ENDPOINTS } from "./device.endpoints";

type ClaimDeviceResult = {
  factoryMac: string;
};

// Bridges the phone <-> backend claim handshake through the now-bonded BLE
// link: read the device's identity, relay claim/start's challenge to it,
// relay its signature back to claim/finish. Note claim/start and claim/finish
// return their payload directly rather than the app's usual { success, data }
// envelope, so we read response.data as-is instead of validateApiResponse().
export const useClaimDeviceMutation = () => {
  return useMutation<ClaimDeviceResult, ApiError, { device: BleDevice }>(
    buildMutationOptions(deviceKeys.all, {
      mutationFn: async ({ device }) => {
        try {
          // First encrypted GATT op on the connection -- this is what
          // triggers the OS bonding prompt. (The actual root cause of this
          // failing was the firmware declaring READ_ENC without the base
          // READ flag -- see ble_manager.cpp -- not a discovery-staleness
          // issue; re-discovering on every retry attempt was a workaround
          // for the wrong theory and risked cancelling its own in-flight
          // reads, so this just retries the read itself.)
          const factoryMacChar = await retryDuringBonding(() =>
            device.readCharacteristicForService(
              MOTION_SENSOR_SERVICE_UUID,
              FACTORY_MAC_CHAR_UUID,
            ),
          );
          const factoryMac = base64ToAscii(factoryMacChar.value ?? "");

          const publicKeyChar = await device.readCharacteristicForService(
            MOTION_SENSOR_SERVICE_UUID,
            PUBLIC_KEY_CHAR_UUID,
          );
          const publicKey = base64ToHex(publicKeyChar.value ?? "");

          const { data: startData } = await api.post(
            DEVICE_ENDPOINTS.claimStart,
            {
              factory_mac: factoryMac,
            },
          );
          const challenge: string = startData.challenge;

          await writeChunkedValue(device, CLAIM_CHALLENGE_CHAR_UUID, challenge);

          // 128 hex chars = 64 raw bytes, the actual signature length --
          // not just "non-empty". The firmware's empty-sentinel value
          // apparently doesn't read back as truly 0-length, so a bare
          // non-empty check was returning on the very first poll, before
          // the real signature was ever written (confirmed via backend
          // logs: "Invalid signature length: 1").
          const signature = await pollUntilReady(
            device,
            CLAIM_SIGNATURE_CHAR_UUID,
            (value) => base64ToHex(value).length === 128,
            30000,
          ).then(base64ToHex);

          await api.post(DEVICE_ENDPOINTS.claimFinish, {
            factory_mac: factoryMac,
            challenge,
            signature,
            public_key: publicKey,
          });

          return { factoryMac };
        } catch (error) {
          throw handleApiError(describeBleError(error));
        }
      },
    }),
  );
};

type SendWifiCredentialsResult = {
  status: string;
};

// Writes SSID + password over the now-bonded link and waits for the
// firmware's "saved" status value (or an "error: ..." one) rather than
// assuming the write succeeding means the credentials were persisted.
export const useSendWifiCredentialsMutation = () => {
  return useMutation<
    SendWifiCredentialsResult,
    ApiError,
    { device: BleDevice; ssid: string; password: string }
  >({
    mutationFn: async ({ device, ssid, password }) => {
      try {
        await writeChunkedValue(device, SSID_CHAR_UUID, ssid);
        await writeChunkedValue(device, PASSWORD_CHAR_UUID, password);

        const status = base64ToAscii(
          await pollUntilReady(
            device,
            STATUS_CHAR_UUID,
            (value) => value.length > 0,
            30000,
          ),
        );
        if (status !== "saved") {
          throw new Error(status);
        }

        return { status };
      } catch (error) {
        throw handleApiError(describeBleError(error));
      }
    },
  });
};

// "ssid,rssi,secure" -- parsed from the right, since rssi/secure are always
// simple fixed-format fields but the ssid itself could (rarely) contain a
// comma. Matches BleManager::completeWifiScan's line format exactly.
function parseWifiNetworkLine(line: string): WifiNetwork | null {
  const parts = line.split(",");
  if (parts.length < 3) return null;

  const secureRaw = parts.pop() as string;
  const rssiRaw = parts.pop() as string;
  const ssid = parts.join(",");

  const rssi = Number(rssiRaw);
  if (!ssid || Number.isNaN(rssi)) return null;

  return { ssid, rssi, secure: secureRaw === "1" };
}

// Triggers the device's own WiFi scan (see BleManager::loopWifiScan in the
// firmware) and polls for the joined result list ("ssid,rssi,secure\n...",
// one write, one eventual read) rather than a notify -- see
// CLAIM_SIGNATURE_CHAR_UUID's poll above for why notify()+read-back on an
// encrypted characteristic isn't reliable here. This has to run on the
// device, not the phone -- iOS gives apps no API to scan for nearby WiFi
// networks at all, so a phone-side scan would mean no picker on iOS.
export const useScanWifiNetworksMutation = () => {
  return useMutation<WifiNetwork[], ApiError, { device: BleDevice }>({
    mutationFn: async ({ device }) => {
      try {
        await device.writeCharacteristicWithResponseForService(
          MOTION_SENSOR_SERVICE_UUID,
          WIFI_SCAN_CHAR_UUID,
          asciiToBase64("scan"),
        );

        const raw = await pollUntilReady(
          device,
          WIFI_SCAN_CHAR_UUID,
          (value) => base64ToAscii(value) !== WIFI_SCAN_PENDING_MARKER,
          20000,
          800, // scanning takes real time -- no need to poll every 400ms
        );

        const text = base64ToAscii(raw);
        if (text === WIFI_SCAN_FAILED_MARKER) {
          throw new Error("Couldn't scan for networks. Please try again.");
        }

        return text
          .split(CHUNK_TERMINATOR)
          .map(parseWifiNetworkLine)
          .filter((network): network is WifiNetwork => network !== null);
      } catch (error) {
        throw handleApiError(describeBleError(error));
      }
    },
  });
};
