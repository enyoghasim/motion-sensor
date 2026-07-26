import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCurrentUserQuery } from "@/modules/auth/services/auth.query";
import { DeviceCard } from "@/modules/devices/components/device-card";
import { useAllDevicesQuery } from "@/modules/devices/services/device.query";
import { PullToRefreshList } from "@/modules/shared/components/pull-to-refresh-list";
import { Spinner } from "@/modules/shared/components/spinner";
import { ThemedText } from "@/modules/shared/components/themed-text";

export default function DevicesScreen() {
  const { data: user } = useCurrentUserQuery();
  const isVerified = !!user?.email_verified;

  const { data, isLoading, refetch, dataUpdatedAt } =
    useAllDevicesQuery(isVerified);
  const devices = data?.items ?? [];

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView edges={["top"]} className="flex-1">
        <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
          <ThemedText variant="lg" weight="medium">
            Devices
          </ThemedText>

          <Pressable
            hitSlop={12}
            onPress={() => router.push("/(app)/(tabs)/devices/add")}
            className="h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-white"
          >
            <HugeiconsIcon
              icon={PlusSignIcon}
              size={15}
              color="#ffffff"
              strokeWidth={2}
            />
          </Pressable>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Spinner color="#ffffff" size={28} />
          </View>
        ) : (
          <PullToRefreshList
            data={devices}
            keyExtractor={(item) => item.id}
            contentContainerClassName="grow gap-4 px-6 pb-6"
            renderItem={({ item }) => <DeviceCard device={item} />}
            onRefresh={refetch}
            lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : null}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center px-6">
                <ThemedText variant="md" className="text-center text-zinc-500">
                  No devices yet.
                </ThemedText>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}
