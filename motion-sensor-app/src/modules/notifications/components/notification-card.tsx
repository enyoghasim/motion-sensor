import {
  BellIcon,
  InformationCircleIcon,
  Motion02Icon,
  SecurityCheckIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Pressable, View } from "react-native";

import { ThemedText } from "../../shared/components/themed-text";
import { useMarkNotificationReadMutation } from "../services/notification.mutation";
import { Notification } from "../types";

type NotificationCardProps = {
  notification: Notification;
};

export function NotificationCard({ notification }: NotificationCardProps) {
  const markReadMutation = useMarkNotificationReadMutation();

  const getIcon = (type: string) => {
    switch (type) {
      case "motion":
        return Motion02Icon;
      case "security":
        return SecurityCheckIcon;
      case "system":
        return InformationCircleIcon;
      default:
        return BellIcon;
    }
  };



  const formattedDate = new Date(notification.created_at).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePress = () => {
    if (!notification.read) {
      markReadMutation.mutate(notification.id);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className={`flex-row items-start gap-3.5 rounded-2xl p-4 transition-all ${
        notification.read
          ? "border border-zinc-800/80 bg-zinc-900/40"
          : "border border-orange-500/30 bg-zinc-900"
      }`}
    >
      <View
        className={`h-10 w-10 items-center justify-center rounded-xl ${
          notification.read ? "bg-zinc-800" : "bg-orange-500/10"
        }`}
      >
        <HugeiconsIcon
          icon={getIcon(notification.type)}
          size={20}
          color={notification.read ? "#71717a" : "#f97316"}
        />
      </View>

      <View className="flex-1 gap-1">
        <View className="flex-row items-center justify-between">
          <ThemedText
            variant="md"
            weight={notification.read ? "regular" : "medium"}
            className={notification.read ? "text-zinc-400" : "text-white"}
          >
            {notification.title}
          </ThemedText>

          {!notification.read && (
            <View className="h-2 w-2 rounded-full bg-orange-500" />
          )}
        </View>

        <ThemedText variant="sm" className="text-zinc-400">
          {notification.message}
        </ThemedText>

        <View className="mt-1 flex-row items-center justify-between">
          <ThemedText variant="xs" className="text-zinc-500">
            {formattedDate}
          </ThemedText>

          {!notification.read && (
            <Pressable
              hitSlop={8}
              onPress={handlePress}
              className="flex-row items-center gap-1"
            >
              <HugeiconsIcon icon={Tick02Icon} size={14} color="#f97316" />
              <ThemedText variant="xs" className="text-orange-500">
                Mark read
              </ThemedText>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}
