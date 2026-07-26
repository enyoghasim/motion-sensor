import { ArrowLeft01Icon, ArrowRight01Icon, BoxIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/modules/shared/components/themed-text";

export default function FirmwareUpdatesScreen() {
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
            Firmware update
          </ThemedText>

          <View className="h-10 w-10" />
        </View>

        <View className="px-6 pt-2">
          <View className="flex-row items-center justify-between rounded-2xl bg-zinc-900 px-4 py-4">
            <ThemedText variant="md">Automatic update</ThemedText>
            <View className="flex-row items-center gap-2">
              <ThemedText variant="sm" className="text-zinc-400">
                Off
              </ThemedText>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#71717a" />
            </View>
          </View>

          <ThemedText variant="sm" className="px-1 pt-3 text-zinc-500">
            Automatically update your devices&apos; firmware within your
            specified time frame. During updates, devices will temporarily
            stop running.
          </ThemedText>

          <ThemedText variant="sm" className="px-1 pb-2 pt-6 text-zinc-500">
            Manual update
          </ThemedText>
        </View>

        <View className="flex-1 items-center justify-center gap-3 px-6 pb-24">
          <HugeiconsIcon icon={BoxIcon} size={56} color="#3f3f46" />
          <ThemedText variant="md" className="text-zinc-500">
            No device available
          </ThemedText>
        </View>
      </SafeAreaView>
    </View>
  );
}
