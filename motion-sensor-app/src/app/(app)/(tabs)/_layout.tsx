import {
  Home01Icon,
  Database01Icon,
  Notification01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";
import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from "expo-router/ui";
import { Pressable, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCurrentUserQuery } from "@/modules/auth/services/auth.query";
import { useNotificationUnreadCountQuery } from "@/modules/notifications/services/notification.query";
import { ThemedText } from "@/modules/shared/components/themed-text";
import { cn } from "@/modules/shared/lib/util";

export default function TabsLayout() {
  const { data: user } = useCurrentUserQuery();
  const isVerified = !!user?.email_verified;
  const { data: unreadSummary } = useNotificationUnreadCountQuery(isVerified);
  const hasUnread = !!unreadSummary?.has_unread;

  return (
    <Tabs className="flex-1 bg-black">
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon={Home01Icon}>Space</TabButton>
          </TabTrigger>
          <TabTrigger name="devices" href="/devices" asChild>
            <TabButton icon={Database01Icon}>Devices</TabButton>
          </TabTrigger>
          <TabTrigger name="notifications" href="/notifications" asChild>
            <TabButton icon={Notification01Icon} showDot={hasUnread}>
              Notifications
            </TabButton>
          </TabTrigger>
          <TabTrigger name="me" href="/me" asChild>
            <TabButton icon={UserCircleIcon}>Me</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  icon: IconSvgElement;
  children: string;
  showDot?: boolean;
};

function TabButton({
  icon,
  children,
  showDot,
  isFocused,
  onPress,
  ...props
}: TabButtonProps) {
  const progress = useDerivedValue(
    () => withTiming(isFocused ? 1 : 0, { duration: 150 }),
    [isFocused],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.05]) }],
  }));

  const handlePress: TabButtonProps["onPress"] = (event) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(event);
  };

  return (
    <Pressable
      {...props}
      onPress={handlePress}
      className="flex-1 items-center justify-center gap-1 py-2"
      style={({ pressed }) => pressed && { opacity: 0.7 }}
    >
      <Animated.View
        style={animatedStyle}
        className="items-center justify-center gap-1 relative"
      >
        <View className="relative">
          <HugeiconsIcon
            icon={icon}
            size={24}
            strokeWidth={2.2}
            color={isFocused ? "#ffffff" : "#71717a"}
          />
          {showDot && (
            <View className="absolute -right-1 -top-0.5 h-2.5 w-2.5 rounded-full bg-orange-500 border-2 border-black" />
          )}
        </View>
        <ThemedText variant="sm" className={cn(!isFocused && "text-[#71717a]")}>
          {children}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      {...props}
      className="flex-row bg-black"
      style={{ paddingBottom: insets.bottom }}
    />
  );
}
