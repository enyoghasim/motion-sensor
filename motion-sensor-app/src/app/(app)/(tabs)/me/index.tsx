import {
  ArrowRight01Icon,
  CircleArrowUp01Icon,
  Settings01Icon,
  User02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react-native";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCurrentUserQuery } from "@/modules/auth/services/auth.query";
import { ThemedText } from "@/modules/shared/components/themed-text";

function getInitials(name?: string) {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function MeScreen() {
  const { data: user } = useCurrentUserQuery();
  const initials = getInitials(user?.name);

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView edges={["top"]} className="flex-1">
        <Pressable
          onPress={() => router.push("/account-settings")}
          className="flex-row items-center gap-4 px-6 pb-6 pt-4 active:opacity-80"
        >
          <View className="h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
            {initials ? (
              <ThemedText variant="lg" weight="bold">
                {initials}
              </ThemedText>
            ) : (
              <HugeiconsIcon icon={User02Icon} size={28} color="#71717a" />
            )}
          </View>

          <View className="flex-1">
            <ThemedText variant="lg" weight="bold" numberOfLines={1}>
              {user?.name ?? "..."}
            </ThemedText>
            <ThemedText
              variant="sm"
              className="text-zinc-400"
              numberOfLines={1}
            >
              {user?.email ?? ""}
            </ThemedText>
          </View>

          <HugeiconsIcon icon={ArrowRight01Icon} size={22} color="#71717a" />
        </Pressable>

        <View className="gap-2 px-6">
          <MenuRow
            icon={CircleArrowUp01Icon}
            label="Firmware update"
            onPress={() => router.push("/firmware-updates")}
          />
          <MenuRow
            icon={Settings01Icon}
            label="Account settings"
            onPress={() => router.push("/account-settings")}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

type MenuRowProps = {
  icon: IconSvgElement;
  label: string;
  onPress: () => void;
};

function MenuRow({ icon, label, onPress }: MenuRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-4 active:bg-zinc-800"
    >
      <HugeiconsIcon icon={icon} size={20} color="#ffffff" />
      <ThemedText variant="md" className="flex-1">
        {label}
      </ThemedText>
      <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#71717a" />
    </Pressable>
  );
}
