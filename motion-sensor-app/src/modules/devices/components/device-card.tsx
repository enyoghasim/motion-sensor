import { Motion02Icon, Unlink03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { router } from "expo-router";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/modules/shared/components/themed-text";
import { Device } from "../types";

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function isOnline(device: Device) {
  if (!device.last_seen) return false;
  return Date.now() - new Date(device.last_seen).getTime() < ONLINE_THRESHOLD_MS;
}

export function DeviceCard({ device }: { device: Device }) {
  const online = isOnline(device);

  return (
    <Pressable
      onPress={() => router.push(`/(app)/(spaces)/${device.id}`)}
      className="flex-row items-center justify-between rounded-3xl bg-zinc-900 px-6 py-8 active:opacity-80"
    >
      <ThemedText variant="lg" weight="medium" className="flex-1 text-zinc-400">
        {device.name ?? device.factory_mac}
      </ThemedText>

      <View className="h-20 w-20 items-center justify-center rounded-2xl bg-zinc-800">
        <HugeiconsIcon icon={Motion02Icon} size={36} color="#71717a" />
      </View>

      {!online && (
        <View className="absolute right-4 top-4">
          <HugeiconsIcon icon={Unlink03Icon} size={18} color="#f97316" />
        </View>
      )}
    </Pressable>
  );
}
