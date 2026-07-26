import {
  BellIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Hexagon01Icon,
  PlusSignIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useCurrentUserQuery } from "@/modules/auth/services/auth.query";
import { DeviceCard } from "@/modules/devices/components/device-card";
import { useGetSpaceDevices } from "@/modules/devices/services/device.query";
import { PullToRefreshList } from "@/modules/shared/components/pull-to-refresh-list";
import { Spinner } from "@/modules/shared/components/spinner";
import { ThemedText } from "@/modules/shared/components/themed-text";
import { resolveSpaceIcon } from "@/modules/spaces/lib/icon-registry";
import { useSelectedSpaceStore } from "@/modules/spaces/store/selected-space.store";
import { useSpacesQuery } from "@/modules/spaces/services/space.query";

export default function AppIndex() {
  const { data: user } = useCurrentUserQuery();
  const isVerified = !!user?.email_verified;
  const insets = useSafeAreaInsets();

  const { data: spaces = [] } = useSpacesQuery(isVerified);

  const { selectedSpaceId, setSelectedSpaceId } = useSelectedSpaceStore();
  const selectedSpace =
    spaces.find((space) => space.id === selectedSpaceId) ?? spaces[0] ?? null;

  useEffect(() => {
    if (spaces.length === 0) return;
    if (!spaces.some((space) => space.id === selectedSpaceId)) {
      setSelectedSpaceId(spaces[0].id);
    }
  }, [spaces, selectedSpaceId, setSelectedSpaceId]);

  const {
    data,
    isLoading,
    refetch,
    dataUpdatedAt,
  } = useGetSpaceDevices(selectedSpace?.id ?? null, isVerified);
  const devices = data?.items ?? [];

  const [isSpaceMenuOpen, setIsSpaceMenuOpen] = useState(false);

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
              {selectedSpace?.name ?? ""}
            </ThemedText>
            <HugeiconsIcon
              icon={isSpaceMenuOpen ? ChevronUpIcon : ChevronDownIcon}
              size={20}
              color="#ffffff"
            />
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
                className="ml-6 w-56 overflow-hidden rounded-2xl bg-zinc-900"
              >
                {spaces.map((space) => (
                  <Pressable
                    key={space.id}
                    onPress={() => {
                      setSelectedSpaceId(space.id);
                      setIsSpaceMenuOpen(false);
                    }}
                    className="flex-row items-center gap-3 px-4 py-3 active:bg-zinc-800"
                  >
                    <HugeiconsIcon
                      icon={resolveSpaceIcon(space.icon)}
                      size={18}
                      color="#ffffff"
                    />
                    <ThemedText
                      variant="md"
                      weight={
                        space.id === selectedSpace?.id ? "medium" : "regular"
                      }
                      className="flex-1"
                    >
                      {space.name}
                    </ThemedText>
                    {space.id === selectedSpace?.id && (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        size={18}
                        color="#ffffff"
                      />
                    )}
                  </Pressable>
                ))}

                <View className="h-px bg-zinc-700" />

                <Pressable
                  onPress={() => {
                    setIsSpaceMenuOpen(false);
                    router.push("/spaces");
                  }}
                  className="flex-row items-center gap-3 px-4 py-3 active:bg-zinc-800"
                >
                  <HugeiconsIcon
                    icon={Hexagon01Icon}
                    size={18}
                    color="#71717a"
                  />
                  <ThemedText variant="md" className="text-zinc-500">
                    Space management
                  </ThemedText>
                </Pressable>
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
              onPress={() => router.push("/spaces/new")}
              className="h-9 w-9 items-center justify-center rounded-full border border-zinc-700"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={18} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Spinner color="#ffffff" size={28} />
          </View>
        ) : devices.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <ThemedText variant="md" className="text-center text-zinc-500">
              No devices yet. Tap + to add one.
            </ThemedText>
          </View>
        ) : (
          <PullToRefreshList
            data={devices}
            keyExtractor={(item) => item.id}
            contentContainerClassName="gap-4 px-6 pb-6"
            renderItem={({ item }) => <DeviceCard device={item} />}
            onRefresh={refetch}
            lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : null}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
