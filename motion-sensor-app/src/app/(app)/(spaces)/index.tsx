import {
  BellIcon,
  ChevronDownIcon,
  PlusSignIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { DeviceCard } from "@/modules/devices/components/device-card";
import { useDevicesQuery } from "@/modules/devices/services/device.query";
import { ThemedText } from "@/modules/shared/components/themed-text";

const SPACES = ["House"];

export default function SpaceScreen() {
  const { data, isLoading } = useDevicesQuery();
  const devices = data?.items ?? [];
  const insets = useSafeAreaInsets();

  const [isSpaceMenuOpen, setIsSpaceMenuOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(SPACES[0]);

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView edges={["top"]} className="flex-1">
        <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
          <Pressable
            className="flex-row items-center gap-1"
            hitSlop={12}
            onPress={() => setIsSpaceMenuOpen(true)}
          >
            <ThemedText variant="lg" weight="medium">
              {selectedSpace}
            </ThemedText>
            <HugeiconsIcon icon={ChevronDownIcon} size={20} color="#ffffff" />
          </Pressable>

          <Modal
            visible={isSpaceMenuOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setIsSpaceMenuOpen(false)}
          >
            <Pressable
              className="flex-1 bg-black/40"
              onPress={() => setIsSpaceMenuOpen(false)}
            >
              <View
                style={{ marginTop: insets.top + 52 }}
                className="ml-6 w-48 overflow-hidden rounded-2xl bg-zinc-900"
              >
                {SPACES.map((space) => (
                  <Pressable
                    key={space}
                    onPress={() => {
                      setSelectedSpace(space);
                      setIsSpaceMenuOpen(false);
                    }}
                    className="flex-row items-center justify-between px-4 py-3 active:bg-zinc-800"
                  >
                    <ThemedText
                      variant="md"
                      weight={space === selectedSpace ? "medium" : "regular"}
                    >
                      {space}
                    </ThemedText>
                    {space === selectedSpace && (
                      <HugeiconsIcon icon={Tick02Icon} size={18} color="#ffffff" />
                    )}
                  </Pressable>
                ))}
              </View>
            </Pressable>
          </Modal>

          <View className="flex-row items-center gap-4">
            <Pressable hitSlop={12} className="relative">
              <HugeiconsIcon icon={BellIcon} size={26} color="#ffffff" />
              <View className="absolute right-0 top-0 h-2 w-2 rounded-full bg-orange-500" />
            </Pressable>

            <Pressable
              hitSlop={12}
              onPress={() => router.push("/(app)/(spaces)/new")}
              className="h-9 w-9 items-center justify-center rounded-full border border-zinc-700"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={18} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#ffffff" />
          </View>
        ) : devices.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <ThemedText variant="md" className="text-center text-zinc-500">
              No devices yet. Tap + to add one.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            contentContainerClassName="gap-4 px-6 pb-6"
            renderItem={({ item }) => <DeviceCard device={item} />}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
