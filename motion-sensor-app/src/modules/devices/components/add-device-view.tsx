import React, { useEffect, useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon, RefreshIcon } from "@hugeicons/core-free-icons";

import { ThemedText } from "../../shared/components/themed-text";
import { DiscoveredDevice } from "../types";
import { RadarScanner } from "./radar-scanner";
import { DiscoveredDeviceCard } from "./discovered-device-card";

const DISCOVERY_DELAY_MS = 2500;

// There's no BLE discovery/pairing endpoint yet, so nearby devices are
// simulated until the real scan flow is wired up to the backend.
const MOCK_NEARBY_DEVICES: DiscoveredDevice[] = [
  { id: "1", name: "Motion Sensor Alpha", mac: "AA:BB:CC:11:22:33" },
  { id: "2", name: "Motion Sensor Beta", mac: "AA:BB:CC:44:55:66" },
];

export const AddDeviceView = () => {
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
  const [pairingDeviceId, setPairingDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDiscoveredDevices(MOCK_NEARBY_DEVICES);
    }, DISCOVERY_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const handlePair = (id: string) => {
    setPairingDeviceId(id);
    setTimeout(() => {
      setPairingDeviceId(null);
      router.back();
    }, 1500);
  };

  const handleRescan = () => {
    setDiscoveredDevices([]);
    setTimeout(() => {
      setDiscoveredDevices(MOCK_NEARBY_DEVICES);
    }, DISCOVERY_DELAY_MS);
  };

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
          <View className="my-4 items-center justify-center">
            <RadarScanner size={260} />
          </View>

          <View className="items-center gap-2">
            <ThemedText
              variant="lg"
              weight="medium"
              className="text-center text-blue-500"
            >
              Scanning for Bluetooth devices nearby...
            </ThemedText>
            <ThemedText variant="md" className="text-center text-zinc-400">
              Bring phone closer to device.
            </ThemedText>
          </View>

          {discoveredDevices.length > 0 && (
            <View className="w-full gap-3 pt-2">
              <View className="flex-row items-center justify-between px-1">
                <ThemedText variant="sm" weight="semibold" className="text-zinc-400 uppercase tracking-wider">
                  Nearby Devices ({discoveredDevices.length})
                </ThemedText>
                <Pressable onPress={handleRescan} className="flex-row items-center gap-1">
                  <HugeiconsIcon icon={RefreshIcon} size={14} color="#3b82f6" />
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
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
