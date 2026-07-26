import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { FlatList, Pressable, View } from "react-native";

import { cn } from "@/modules/shared/lib/util";
import { ThemedText } from "@/modules/shared/components/themed-text";
import {
  SPACE_ICON_KEYS,
  SPACE_ICON_REGISTRY,
  resolveSpaceIcon,
  type SpaceIconKey,
} from "@/modules/spaces/lib/icon-registry";

type SpaceIconAvatarProps = {
  icon: SpaceIconKey;
  onPress: () => void;
};

export function SpaceIconAvatar({ icon, onPress }: SpaceIconAvatarProps) {
  return (
    <Pressable onPress={onPress} className="items-center gap-2 self-center">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-zinc-800 active:bg-zinc-700">
        <HugeiconsIcon icon={resolveSpaceIcon(icon)} size={28} color="#ffffff" />
      </View>
      <ThemedText variant="xs" className="text-zinc-500">
        Tap to change icon
      </ThemedText>
    </Pressable>
  );
}

type IconPickerGridProps = {
  selected: SpaceIconKey;
  onSelect: (icon: SpaceIconKey) => void;
  onClose: () => void;
};

export function IconPickerGrid({ selected, onSelect, onClose }: IconPickerGridProps) {
  return (
    <View className="gap-4">
      <Pressable
        onPress={onClose}
        hitSlop={12}
        className="flex-row items-center gap-2 self-start"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#ffffff" />
        <ThemedText variant="lg" weight="medium">
          Choose an icon
        </ThemedText>
      </Pressable>

      <FlatList
        data={SPACE_ICON_KEYS}
        keyExtractor={(key) => key}
        numColumns={4}
        scrollEnabled={false}
        columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
        renderItem={({ item }) => {
          const isSelected = item === selected;
          return (
            <Pressable
              onPress={() => onSelect(item)}
              style={{ aspectRatio: 1 }}
              className={cn(
                "flex-1 items-center justify-center rounded-2xl",
                isSelected ? "bg-white" : "bg-zinc-800 active:bg-zinc-700"
              )}
            >
              <HugeiconsIcon
                icon={SPACE_ICON_REGISTRY[item]}
                size={24}
                color={isSelected ? "#000000" : "#ffffff"}
              />
            </Pressable>
          );
        }}
      />
    </View>
  );
}
