import {
  ArrowLeft01Icon,
  Delete02Icon,
  PencilEdit01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { router } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/modules/shared/components/button";
import { ErrorMessage } from "@/modules/shared/components/error-message";
import { Input } from "@/modules/shared/components/input";
import { PullToRefreshList } from "@/modules/shared/components/pull-to-refresh-list";
import { Spinner } from "@/modules/shared/components/spinner";
import { ThemedText } from "@/modules/shared/components/themed-text";
import {
  IconPickerGrid,
  SpaceIconAvatar,
} from "@/modules/spaces/components/icon-picker";
import {
  DEFAULT_SPACE_ICON_KEY,
  isSpaceIconKey,
  resolveSpaceIcon,
  type SpaceIconKey,
} from "@/modules/spaces/lib/icon-registry";
import {
  useCreateSpaceMutation,
  useDeleteSpaceMutation,
  useUpdateSpaceMutation,
} from "@/modules/spaces/services/space.mutation";
import { useSpacesQuery } from "@/modules/spaces/services/space.query";
import { Space } from "@/modules/spaces/types";

export default function SpaceManagementScreen() {
  const {
    data: spaces = [],
    isLoading,
    refetch,
    dataUpdatedAt,
  } = useSpacesQuery();
  const createMutation = useCreateSpaceMutation();
  const updateMutation = useUpdateSpaceMutation();
  const deleteMutation = useDeleteSpaceMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateIconPickerOpen, setIsCreateIconPickerOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<SpaceIconKey>(DEFAULT_SPACE_ICON_KEY);

  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [isEditIconPickerOpen, setIsEditIconPickerOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState<SpaceIconKey>(
    DEFAULT_SPACE_ICON_KEY,
  );

  const [deletingSpace, setDeletingSpace] = useState<Space | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const closeModal = () => {
    setIsCreateOpen(false);
    setIsCreateIconPickerOpen(false);
    setName("");
    setIcon(DEFAULT_SPACE_ICON_KEY);
    createMutation.reset();
  };

  const onCreate = () => {
    if (!name.trim()) return;
    createMutation.mutate(
      { name: name.trim(), icon },
      { onSuccess: () => closeModal() },
    );
  };

  const openEdit = (space: Space) => {
    setEditingSpace(space);
    setEditName(space.name);
    setEditIcon(
      isSpaceIconKey(space.icon) ? space.icon : DEFAULT_SPACE_ICON_KEY,
    );
    setIsEditIconPickerOpen(false);
  };

  const closeEdit = () => {
    setEditingSpace(null);
    setIsEditIconPickerOpen(false);
    setEditName("");
    setEditIcon(DEFAULT_SPACE_ICON_KEY);
    updateMutation.reset();
  };

  const onSaveEdit = () => {
    if (!editingSpace || !editName.trim()) return;
    updateMutation.mutate(
      { id: editingSpace.id, name: editName.trim(), icon: editIcon },
      { onSuccess: () => closeEdit() },
    );
  };

  const openDeleteConfirm = (space: Space) => {
    setDeletingSpace(space);
    setIsDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setIsDeleteConfirmOpen(false);
    deleteMutation.reset();
  };

  const onConfirmDelete = () => {
    if (!deletingSpace) return;
    deleteMutation.mutate(
      { id: deletingSpace.id },
      { onSuccess: () => closeDeleteConfirm() },
    );
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
            <Spinner color="#ffffff" size={28} />
          </View>
        ) : (
          <PullToRefreshList
            data={spaces}
            keyExtractor={(item) => String(item.id)}
            contentContainerClassName="grow gap-2 px-6 pb-6"
            onRefresh={refetch}
            lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : null}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center px-6">
                <ThemedText variant="md" className="text-center text-zinc-500">
                  No spaces yet. Tap + to create one.
                </ThemedText>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/spaces/${item.id}`)}
                className="flex-row items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-4 active:bg-zinc-800"
              >
                <HugeiconsIcon
                  icon={resolveSpaceIcon(item.icon)}
                  size={20}
                  color="#ffffff"
                />
                <ThemedText variant="md" className="flex-1">
                  {item.name}
                </ThemedText>
                <Pressable
                  hitSlop={12}
                  onPress={() => openEdit(item)}
                  className="h-8 w-8 items-center justify-center"
                >
                  <View pointerEvents="none">
                    <HugeiconsIcon
                      icon={PencilEdit01Icon}
                      size={18}
                      color="#71717a"
                    />
                  </View>
                </Pressable>
                <Pressable
                  hitSlop={12}
                  onPress={() => openDeleteConfirm(item)}
                  className="h-8 w-8 items-center justify-center"
                >
                  <View pointerEvents="none">
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      size={18}
                      color="#ef4444"
                      className=" text-danger-hover"
                    />
                  </View>
                </Pressable>
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
            {isCreateIconPickerOpen ? (
              <IconPickerGrid
                selected={icon}
                onSelect={(key) => {
                  setIcon(key);
                  setIsCreateIconPickerOpen(false);
                }}
                onClose={() => setIsCreateIconPickerOpen(false)}
              />
            ) : (
              <>
                <ThemedText variant="lg" weight="medium">
                  New space
                </ThemedText>

                <SpaceIconAvatar
                  icon={icon}
                  onPress={() => setIsCreateIconPickerOpen(true)}
                />

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
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={editingSpace !== null}
        transparent
        animationType="fade"
        onRequestClose={closeEdit}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/60 px-6"
          onPress={closeEdit}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="w-full gap-4 rounded-2xl bg-zinc-900 p-6"
          >
            {isEditIconPickerOpen ? (
              <IconPickerGrid
                selected={editIcon}
                onSelect={(key) => {
                  setEditIcon(key);
                  setIsEditIconPickerOpen(false);
                }}
                onClose={() => setIsEditIconPickerOpen(false)}
              />
            ) : (
              <>
                <ThemedText variant="lg" weight="medium">
                  Edit space
                </ThemedText>

                <SpaceIconAvatar
                  icon={editIcon}
                  onPress={() => setIsEditIconPickerOpen(true)}
                />

                <Input
                  label="Space name"
                  value={editName}
                  onChangeText={setEditName}
                  autoFocus
                  size="md"
                />

                {updateMutation.error && (
                  <ErrorMessage
                    message={updateMutation.error.errors}
                    fallback="Couldn't update the space. Please try again."
                  />
                )}

                <Button
                  title={updateMutation.isPending ? "Saving..." : "Save"}
                  onPress={onSaveEdit}
                  loading={updateMutation.isPending}
                  disabled={!editName.trim()}
                />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isDeleteConfirmOpen}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteConfirm}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/60 px-6"
          onPress={closeDeleteConfirm}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="w-full gap-4 rounded-2xl bg-zinc-900 p-6"
          >
            <ThemedText variant="lg" weight="medium">
              Delete space
            </ThemedText>

            <ThemedText variant="sm" className="text-zinc-400">
              {`Delete "${deletingSpace?.name}"? Devices in this space will become unassigned.`}
            </ThemedText>

            {deleteMutation.error && (
              <ErrorMessage
                message={deleteMutation.error.errors}
                fallback="Couldn't delete the space. Please try again."
              />
            )}

            <View className="flex-row gap-3">
              <Button
                title="Cancel"
                variant="outline-dark"
                onPress={closeDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="flex-1"
              />
              <Button
                title={deleteMutation.isPending ? "Deleting..." : "Delete"}
                variant="danger"
                onPress={onConfirmDelete}
                loading={deleteMutation.isPending}
                className="flex-1"
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
