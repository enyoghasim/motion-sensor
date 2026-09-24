import { SquareLock02Icon, Wifi01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import { Pressable, View } from "react-native";
import { ThemedText } from "../../shared/components/themed-text";
import { WifiNetwork } from "../types";

type WifiNetworkRowProps = {
  network: WifiNetwork;
  onPress: () => void;
};

export const WifiNetworkRow = ({ network, onPress }: WifiNetworkRowProps) => {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-3 active:opacity-80"
    >
      <HugeiconsIcon icon={Wifi01Icon} size={20} color="#71717a" />
      <ThemedText variant="md" className="flex-1 text-white">
        {network.ssid}
      </ThemedText>
      {network.secure && (
        <HugeiconsIcon icon={SquareLock02Icon} size={16} color="#71717a" />
      )}
    </Pressable>
  );
};
