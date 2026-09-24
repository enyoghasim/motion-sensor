import React, { useEffect, useRef, useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { Device as BleDevice } from "react-native-ble-plx";

import { ThemedText } from "../../shared/components/themed-text";
import { ErrorMessage } from "../../shared/components/error-message";
import { DiscoveredDevice } from "../types";
import { RadarScanner } from "./radar-scanner";
import { DiscoveredDeviceCard } from "./discovered-device-card";
import { WifiCredentialsForm } from "./wifi-credentials-form";
import { useClaimDeviceMutation } from "../services/device.mutation";
import {
  describeBleError,
  getBleManager,
  requestBlePermissions,
  waitForPoweredOn,
  MOTION_SENSOR_SERVICE_UUID,
} from "../../shared/lib/ble";

const SCAN_DURATION_MS = 12000;

export const AddDeviceView = () => {
  const [discoveredDevices, setDiscoveredDevices] = useState<
    DiscoveredDevice[]
  >([]);
  const [pairingDeviceId, setPairingDeviceId] = useState<string | null>(null);
  const [pairError, setPairError] = useState<string | null>(null);
  const [claimedDevice, setClaimedDevice] = useState<BleDevice | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [scanGeneration, setScanGeneration] = useState(0);
  const bleDevicesRef = useRef(new Map<string, BleDevice>());
  const connectedDeviceRef = useRef<BleDevice | null>(null);
  // Synchronous guard against handlePair re-entering before the disabled
  // prop (driven by pairingDeviceId state, which updates asynchronously)
  // actually takes effect -- a rapid double-tap could otherwise start two
  // concurrent claim attempts racing over the same challenge/signature
  // characteristics, which is exactly how a real "Invalid signature" was
  // reproduced (one attempt's challenge got signed, a different attempt's
  // challenge was what got sent to claim/finish). Same fix shape as the
  // WiFi scan's mount-effect double-invoke guard.
  const pairingInFlightRef = useRef(false);

  const { mutate: claimDevice } = useClaimDeviceMutation();

  // Disconnects whatever's still connected if this screen is left mid-flow
  // (back button, hardware back) without finishing pairing/WiFi setup --
  // otherwise the phone holds a bonded-but-idle connection open forever.
  useEffect(() => {
    return () => {
      connectedDeviceRef.current?.cancelConnection().catch(() => {});
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const manager = getBleManager();
    setIsScanning(true);

    (async () => {
      const granted = await requestBlePermissions();
      if (cancelled) {
        return;
      }
      if (!granted) {
        setIsScanning(false);
        return;
      }

      await waitForPoweredOn(manager);
      if (cancelled) {
        return;
      }

      manager.startDeviceScan(
        [MOTION_SENSOR_SERVICE_UUID],
        null,
        (error, device) => {
          if (error) {
            console.warn("[BLE] scan error", error);
            return;
          }
          if (!device) {
            return;
          }

          bleDevicesRef.current.set(device.id, device);

          setDiscoveredDevices((prev) => {
            // The name sometimes lands in a separate scan-response packet a
            // moment after the first sighting -- keep updating the entry
            // (not just adding it once) so a device first seen without a
            // name still gets upgraded from "Unknown device" once it arrives,
            // instead of that being locked in permanently.
            const name = device.name ?? device.localName ?? null;
            const existingIndex = prev.findIndex((d) => d.id === device.id);

            if (existingIndex === -1) {
              return [
                ...prev,
                {
                  id: device.id,
                  name: name ?? "Unknown device",
                  mac: device.id,
                },
              ];
            }

            if (name && prev[existingIndex].name !== name) {
              const next = [...prev];
              next[existingIndex] = { ...next[existingIndex], name };
              return next;
            }

            return prev;
          });
        },
      );
    })();

    const stopTimer = setTimeout(() => {
      cancelled = true;
      setIsScanning(false);
      manager.stopDeviceScan();
    }, SCAN_DURATION_MS);

    return () => {
      cancelled = true;
      clearTimeout(stopTimer);
      manager.stopDeviceScan();
    };
  }, [scanGeneration]);

  const handleRescan = () => {
    setDiscoveredDevices([]);
    setScanGeneration((generation) => generation + 1);
  };

  const handlePair = async (id: string) => {
    if (pairingInFlightRef.current) {
      return;
    }
    const rawDevice = bleDevicesRef.current.get(id);
    if (!rawDevice) {
      return;
    }

    pairingInFlightRef.current = true;
    setPairingDeviceId(id);
    setPairError(null);
    getBleManager().stopDeviceScan();
    setIsScanning(false);

    try {
      // On the OS's first encrypted read/write below, the native pairing
      // prompt appears asking the user to enter the passkey shown on the
      // device's OLED (Passkey Entry bonding) before this call resolves.
      // requestMTU is best-effort (Android-only, never guaranteed) -- the
      // actual credential/claim writes chunk against whatever device.mtu
      // ends up being, so this only saves round trips when it succeeds.
      const connectedDevice = await rawDevice.connect({
        requestMTU: 247,
        timeout: 15000,
      });
      connectedDeviceRef.current = connectedDevice;
      await connectedDevice.discoverAllServicesAndCharacteristics();

      claimDevice(
        { device: connectedDevice },
        {
          onSuccess: () => setClaimedDevice(connectedDevice),
          onError: (error) => {
            setPairError(error.message);
            connectedDevice.cancelConnection().catch(() => {});
            connectedDeviceRef.current = null;
          },
          onSettled: () => {
            setPairingDeviceId(null);
            pairingInFlightRef.current = false;
          },
        },
      );
    } catch (rawError) {
      const error = describeBleError(rawError);
      setPairError(
        error instanceof Error ? error.message : "Couldn't connect to device.",
      );
      connectedDeviceRef.current?.cancelConnection().catch(() => {});
      connectedDeviceRef.current = null;
      setPairingDeviceId(null);
      pairingInFlightRef.current = false;
    }
  };

  const hasNoResults = !isScanning && discoveredDevices.length === 0;

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView edges={["top", "bottom"]} className="flex-1">
        <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="h-10 w-10 items-center justify-center -ml-2"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={28} color="#ffffff" />
          </Pressable>

          <ThemedText variant="lg" weight="medium">
            Add a device or system
          </ThemedText>

          <View className="h-10 w-10" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-6 pt-6 pb-8 gap-8 items-center"
        >
          {claimedDevice ? (
            <WifiCredentialsForm
              device={claimedDevice}
              onSuccess={() => {
                connectedDeviceRef.current?.cancelConnection().catch(() => {});
                connectedDeviceRef.current = null;
                router.back();
              }}
            />
          ) : (
            <>
              {pairError && (
                <View className="w-full">
                  <ErrorMessage
                    message={pairError}
                    fallback="Couldn't pair with this device. Please try again."
                  />
                </View>
              )}

              {pairingDeviceId && (
                <View className="w-full items-center px-4">
                  <ThemedText
                    variant="sm"
                    className="text-center text-zinc-400"
                  >
                    If a pairing code appears, enter the code shown on the
                    device's screen. This can take a little while.
                  </ThemedText>
                </View>
              )}

              <View className="my-4 items-center justify-center">
                <RadarScanner
                  key={scanGeneration}
                  size={260}
                  active={isScanning}
                />
              </View>

              <View className="items-center gap-2">
                {isScanning ? (
                  <>
                    <ThemedText
                      variant="lg"
                      weight="medium"
                      className="text-center text-blue-500"
                    >
                      Scanning for Bluetooth devices nearby...
                    </ThemedText>
                    <ThemedText
                      variant="md"
                      className="text-center text-zinc-400"
                    >
                      Bring phone closer to device.
                    </ThemedText>
                  </>
                ) : hasNoResults ? (
                  <>
                    <ThemedText
                      variant="lg"
                      weight="medium"
                      className="text-center text-zinc-300"
                    >
                      No devices found
                    </ThemedText>
                    <ThemedText
                      variant="md"
                      className="text-center text-zinc-400"
                    >
                      Make sure your device is powered on and nearby.
                    </ThemedText>
                    <Pressable
                      onPress={handleRescan}
                      className="mt-2 flex-row items-center gap-1"
                    >
                      <HugeiconsIcon
                        icon={RefreshIcon}
                        size={14}
                        color="#3b82f6"
                      />
                      <ThemedText variant="sm" className="text-blue-500">
                        Scan again
                      </ThemedText>
                    </Pressable>
                  </>
                ) : (
                  <ThemedText
                    variant="lg"
                    weight="medium"
                    className="text-center text-zinc-300"
                  >
                    Scan complete
                  </ThemedText>
                )}
              </View>

              {discoveredDevices.length > 0 && (
                <View className="w-full gap-3 pt-2">
                  <View className="flex-row items-center justify-between px-1">
                    <ThemedText
                      variant="sm"
                      weight="semibold"
                      className="text-zinc-400 uppercase tracking-wider"
                    >
                      Nearby Devices ({discoveredDevices.length})
                    </ThemedText>
                    <Pressable
                      onPress={handleRescan}
                      className="flex-row items-center gap-1"
                    >
                      <HugeiconsIcon
                        icon={RefreshIcon}
                        size={14}
                        color="#3b82f6"
                      />
                      <ThemedText variant="xs" className="text-blue-500">
                        Rescan
                      </ThemedText>
                    </Pressable>
                  </View>

                  {discoveredDevices.map((device) => (
                    <DiscoveredDeviceCard
                      key={device.id}
                      device={device}
                      onPair={handlePair}
                      pairing={pairingDeviceId === device.id}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
