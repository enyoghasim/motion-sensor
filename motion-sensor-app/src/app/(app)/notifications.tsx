import {
  ArrowLeft01Icon,
  BellIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCurrentUserQuery } from "@/modules/auth/services/auth.query";
import { NotificationCard } from "@/modules/notifications/components/notification-card";
import { useMarkAllNotificationsReadMutation } from "@/modules/notifications/services/notification.mutation";
import { useNotificationsQuery } from "@/modules/notifications/services/notification.query";
import { PullToRefreshList } from "@/modules/shared/components/pull-to-refresh-list";
import { Spinner } from "@/modules/shared/components/spinner";
import { ThemedText } from "@/modules/shared/components/themed-text";

export default function NotificationsScreen() {
  const { data: user } = useCurrentUserQuery();
  const isVerified = !!user?.email_verified;

  const { data, isLoading, refetch, dataUpdatedAt } =
    useNotificationsQuery(isVerified);
  const notifications = data?.items ?? [];

  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView edges={["top", "bottom"]} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="-ml-2 h-10 w-10 items-center justify-center"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={28} color="#ffffff" />
          </Pressable>

          <ThemedText variant="lg" weight="medium">
            Notifications
          </ThemedText>

          {hasUnread ? (
            <Pressable
              hitSlop={12}
              onPress={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="flex-row items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5"
            >
              <HugeiconsIcon icon={Tick02Icon} size={14} color="#f97316" />
              <ThemedText variant="xs" weight="medium" className="text-orange-500">
                Read all
              </ThemedText>
            </Pressable>
          ) : (
            <View className="h-10 w-10" />
          )}
        </View>

        {/* Notification List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Spinner color="#ffffff" size={28} />
          </View>
        ) : (
          <PullToRefreshList
            data={notifications}
            keyExtractor={(item) => String(item.id)}
            contentContainerClassName="grow gap-3 px-6 pb-6"
            renderItem={({ item }) => <NotificationCard notification={item} />}
            onRefresh={refetch}
            lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : null}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center gap-3 px-6">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-zinc-900">
                  <HugeiconsIcon icon={BellIcon} size={32} color="#71717a" />
                </View>
                <ThemedText variant="lg" weight="medium" className="text-zinc-400">
                  No notifications yet
                </ThemedText>
                <ThemedText variant="sm" className="text-center text-zinc-500">
                  When motion is detected or system events occur, they will appear here.
                </ThemedText>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}
