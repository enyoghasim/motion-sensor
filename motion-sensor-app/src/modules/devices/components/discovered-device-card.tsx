import React from "react";
import { View, Pressable } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Motion02Icon } from "@hugeicons/core-free-icons";
import { ThemedText } from "../../shared/components/themed-text";
import { Spinner } from "../../shared/components/spinner";
import { DiscoveredDevice } from "../types";

type DiscoveredDeviceCardProps = {
  device: DiscoveredDevice;
  onPair: (id: string) => void;
  pairing?: boolean;
};

export const DiscoveredDeviceCard = ({
  device,
  onPair,
  pairing = false,
}: DiscoveredDeviceCardProps) => {
  return (
    <View className="flex-row items-center justify-between rounded-3xl bg-zinc-900 px-6 py-5 active:opacity-80">
      <View className="flex-1 gap-1">
        <ThemedText variant="lg" weight="medium" className="text-white">
          {device.name}
        </ThemedText>
        <ThemedText variant="xs" className="text-zinc-500 font-mono">
          {device.mac}
        </ThemedText>
      </View>

      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800">
          <HugeiconsIcon icon={Motion02Icon} size={24} color="#71717a" />
        </View>

        <Pressable
          onPress={() => onPair(device.id)}
          disabled={pairing}
          className="h-10 w-20 items-center justify-center rounded-xl bg-white active:bg-zinc-200 disabled:opacity-50"
        >
          {pairing ? (
            <Spinner size={16} color="#000000" />
          ) : (
            <ThemedText variant="sm" weight="semibold" className="text-black">
              Pair
            </ThemedText>
          )}
        </Pressable>
      </View>
    </View>
  );
};
