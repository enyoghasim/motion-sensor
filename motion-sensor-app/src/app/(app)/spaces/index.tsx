import { ArrowLeft01Icon, Home01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
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
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/modules/shared/components/button";
import { ErrorMessage } from "@/modules/shared/components/error-message";
import { Input } from "@/modules/shared/components/input";
import { ThemedText } from "@/modules/shared/components/themed-text";
import { useCreateSpaceMutation } from "@/modules/spaces/services/space.mutation";
import { useSpacesQuery } from "@/modules/spaces/services/space.query";

export default function SpaceManagementScreen() {
  const { data: spaces = [], isLoading } = useSpacesQuery();
  const createMutation = useCreateSpaceMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");

  const closeModal = () => {
    setIsCreateOpen(false);
    setName("");
    createMutation.reset();
  };

  const onCreate = () => {
    if (!name.trim()) return;
    createMutation.mutate(name.trim(), {
      onSuccess: () => closeModal(),
    });
  };

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView edges={["top", "bottom"]} className="flex-1">
        <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="h-10 w-10 items-center justify-center -ml-2"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={28} color="#ffffff" />
          </Pressable>

          <ThemedText variant="lg" weight="medium">
            Space management
          </ThemedText>

          <Pressable
            onPress={() => setIsCreateOpen(true)}
            hitSlop={12}
            className="h-10 w-10 items-center justify-center"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={24} color="#ffffff" />
          </Pressable>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#ffffff" />
          </View>
        ) : spaces.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <ThemedText variant="md" className="text-center text-zinc-500">
              No spaces yet. Tap + to create one.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={spaces}
            keyExtractor={(item) => String(item.id)}
            contentContainerClassName="gap-2 px-6 pb-6"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/spaces/${item.id}`)}
                className="flex-row items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-4 active:bg-zinc-800"
              >
                <HugeiconsIcon icon={Home01Icon} size={20} color="#ffffff" />
                <ThemedText variant="md">{item.name}</ThemedText>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>

      <Modal
        visible={isCreateOpen}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/60 px-6"
          onPress={closeModal}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="w-full gap-4 rounded-2xl bg-zinc-900 p-6"
          >
            <ThemedText variant="lg" weight="medium">
              New space
            </ThemedText>

            <Input
              label="Space name"
              value={name}
              onChangeText={setName}
              autoFocus
              size="md"
            />

            {createMutation.error && (
              <ErrorMessage
                message={createMutation.error.errors}
                fallback="Couldn't create the space. Please try again."
              />
            )}

            <Button
              title={createMutation.isPending ? "Creating..." : "Create"}
              onPress={onCreate}
              loading={createMutation.isPending}
              disabled={!name.trim()}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
