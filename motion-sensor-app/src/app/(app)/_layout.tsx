import {
  Home01Icon,
  RepeatIcon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react-native";
import { Redirect } from "expo-router";
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

import { ThemedText } from "@/modules/shared/components/themed-text";
import { cn } from "@/modules/shared/lib/util";

export default function AppLayout() {
  const token = "getAccessToken()";

  if (!token) {
    // If not authenticated, redirect to login
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs className="flex-1 bg-black">
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon={Home01Icon}>Space</TabButton>
          </TabTrigger>
          <TabTrigger name="automation" href="/automation" asChild>
            <TabButton icon={RepeatIcon}>Automation</TabButton>
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
};

function TabButton({ icon, children, isFocused, ...props }: TabButtonProps) {
  const progress = useDerivedValue(() => withTiming(isFocused ? 1 : 0, { duration: 150 }), [
    isFocused,
  ]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.15]) }],
  }));

  return (
    <Pressable
      {...props}
      className="flex-1 items-center justify-center gap-1 py-2"
      style={({ pressed }) => pressed && { opacity: 0.7 }}
    >
      <Animated.View style={iconAnimatedStyle}>
        <HugeiconsIcon icon={icon} size={24} color={isFocused ? "#ffffff" : "#71717a"} />
      </Animated.View>
      <ThemedText variant="xs" className={cn(!isFocused && "text-[#71717a]")}>
        {children}
      </ThemedText>
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
