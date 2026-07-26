import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { FlatList, Modal, Pressable } from "react-native";

import { cn } from "@/modules/shared/lib/util";
import { ThemedText } from "@/modules/shared/components/themed-text";
import {
  SPACE_ICON_KEYS,
  SPACE_ICON_REGISTRY,
  resolveSpaceIcon,
  type SpaceIconKey,
} from "@/modules/spaces/lib/icon-registry";

type IconPickerProps = {
  visible: boolean;
  selected: SpaceIconKey;
  onSelect: (icon: SpaceIconKey) => void;
  onClose: () => void;
};

export function IconPicker({ visible, selected, onSelect, onClose }: IconPickerProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center bg-black/60 px-6"
        onPress={onClose}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="w-full gap-4 rounded-2xl bg-zinc-900 p-6"
        >
          <ThemedText variant="lg" weight="medium">
            Choose an icon
          </ThemedText>

          <FlatList
            data={SPACE_ICON_KEYS}
            keyExtractor={(key) => key}
            numColumns={4}
            columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
            renderItem={({ item }) => {
              const isSelected = item === selected;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className={cn(
                    "flex-1 aspect-square items-center justify-center rounded-2xl",
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type IconPickerFieldProps = {
  icon: SpaceIconKey;
  onPress: () => void;
};

export function IconPickerField({ icon, onPress }: IconPickerFieldProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl bg-zinc-800 px-4 py-3 active:bg-zinc-700"
    >
      <HugeiconsIcon icon={resolveSpaceIcon(icon)} size={20} color="#ffffff" />
      <ThemedText variant="md" className="flex-1">
        Icon
      </ThemedText>
      <HugeiconsIcon icon={ArrowDown01Icon} size={18} color="#71717a" />
    </Pressable>
  );
}
