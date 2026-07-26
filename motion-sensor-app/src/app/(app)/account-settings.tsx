import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Logout01Icon,
  User02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

import {
  useChangeEmailMutation,
  useChangePasswordMutation,
  useLogoutMutation,
} from "@/modules/auth/services/auth.mutation";
import { useCurrentUserQuery } from "@/modules/auth/services/auth.query";
import {
  ChangeEmailValues,
  changeEmailSchema,
  ChangePasswordValues,
  changePasswordSchema,
} from "@/modules/auth/validations/auth";
import { Button } from "@/modules/shared/components/button";
import { ErrorMessage } from "@/modules/shared/components/error-message";
import { Input } from "@/modules/shared/components/input";
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

export default function AccountSettingsScreen() {
  const { data: user } = useCurrentUserQuery();
  const initials = getInitials(user?.name);

  const changeEmailMutation = useChangeEmailMutation();
  const changePasswordMutation = useChangePasswordMutation();
  const logoutMutation = useLogoutMutation();

  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const emailForm = useForm<ChangeEmailValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { email: "" },
  });

  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const openChangeEmail = () => {
    emailForm.reset({ email: "" });
    changeEmailMutation.reset();
    setIsChangeEmailOpen(true);
  };

  const closeChangeEmail = () => {
    setIsChangeEmailOpen(false);
    changeEmailMutation.reset();
  };

  const onSubmitChangeEmail = (data: ChangeEmailValues) => {
    changeEmailMutation.mutate(data.email, {
      onSuccess: () => {
        toast.success(`A verification code has been sent to ${data.email}`);
        setIsChangeEmailOpen(false);
      },
    });
  };

  const openChangePassword = () => {
    passwordForm.reset({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    changePasswordMutation.reset();
    setIsChangePasswordOpen(true);
  };

  const closeChangePassword = () => {
    setIsChangePasswordOpen(false);
    changePasswordMutation.reset();
  };

  const onSubmitChangePassword = (data: ChangePasswordValues) => {
    changePasswordMutation.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          toast.success("Password changed successfully");
          setIsChangePasswordOpen(false);
        },
      },
    );
  };

  const onConfirmLogout = () => {
    logoutMutation.mutate();
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
            Account settings
          </ThemedText>

          <View className="h-10 w-10" />
        </View>

        <View className="gap-6 px-6 pt-2">
          <View className="items-center gap-3 py-2">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-zinc-800">
              {initials ? (
                <ThemedText variant="lg" weight="bold">
                  {initials}
                </ThemedText>
              ) : (
                <HugeiconsIcon icon={User02Icon} size={32} color="#71717a" />
              )}
            </View>
            <ThemedText variant="lg" weight="bold">
              {user?.name ?? "..."}
            </ThemedText>
          </View>

          <View className="gap-2">
            <Row label="Email" value={user?.email ?? ""} onPress={openChangeEmail} />
          </View>

          <View className="gap-2">
            <ThemedText variant="sm" className="px-1 text-zinc-500">
              Settings
            </ThemedText>
            <Row label="Change password" onPress={openChangePassword} />
          </View>
        </View>

        <View className="flex-1" />

        <Pressable
          onPress={() => setShowLogoutConfirm(true)}
          className="items-center py-6"
          hitSlop={12}
        >
          <View className="flex-row items-center gap-2">
            <HugeiconsIcon
              icon={Logout01Icon}
              size={18}
              className="text-danger-hover"
            />
            <ThemedText
              variant="md"
              weight="medium"
              className="text-danger-hover"
            >
              Log out
            </ThemedText>
          </View>
        </Pressable>
      </SafeAreaView>

      <Modal
        visible={isChangeEmailOpen}
        transparent
        animationType="fade"
        onRequestClose={closeChangeEmail}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/60 px-6"
          onPress={closeChangeEmail}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="w-full gap-4 rounded-2xl bg-zinc-900 p-6"
          >
            <ThemedText variant="lg" weight="medium">
              Change email
            </ThemedText>

            {changeEmailMutation.error && (
              <ErrorMessage
                message={changeEmailMutation.error.errors}
                fallback="Couldn't update your email. Please try again."
              />
            )}

            <Controller
              control={emailForm.control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="New email"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  textContentType="emailAddress"
                  keyboardType="email-address"
                  error={emailForm.formState.errors.email?.message}
                  size="md"
                />
              )}
            />

            <View className="flex-row gap-3">
              <Button
                title="Cancel"
                variant="outline-dark"
                onPress={closeChangeEmail}
                disabled={changeEmailMutation.isPending}
                className="flex-1"
              />
              <Button
                title={changeEmailMutation.isPending ? "Saving..." : "Save"}
                onPress={emailForm.handleSubmit(onSubmitChangeEmail)}
                loading={changeEmailMutation.isPending}
                className="flex-1"
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isChangePasswordOpen}
        transparent
        animationType="fade"
        onRequestClose={closeChangePassword}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/60 px-6"
          onPress={closeChangePassword}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="w-full gap-4 rounded-2xl bg-zinc-900 p-6"
          >
            <ThemedText variant="lg" weight="medium">
              Change password
            </ThemedText>

            {changePasswordMutation.error && (
              <ErrorMessage
                message={changePasswordMutation.error.errors}
                fallback="Couldn't change your password. Please try again."
              />
            )}

            <Controller
              control={passwordForm.control}
              name="currentPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Current password"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry
                  error={passwordForm.formState.errors.currentPassword?.message}
                  size="md"
                />
              )}
            />

            <Controller
              control={passwordForm.control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="New password"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry
                  error={passwordForm.formState.errors.newPassword?.message}
                  size="md"
                />
              )}
            />

            <Controller
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm new password"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry
                  error={passwordForm.formState.errors.confirmPassword?.message}
                  size="md"
                />
              )}
            />

            <View className="flex-row gap-3">
              <Button
                title="Cancel"
                variant="outline-dark"
                onPress={closeChangePassword}
                disabled={changePasswordMutation.isPending}
                className="flex-1"
              />
              <Button
                title={changePasswordMutation.isPending ? "Saving..." : "Save"}
                onPress={passwordForm.handleSubmit(onSubmitChangePassword)}
                loading={changePasswordMutation.isPending}
                className="flex-1"
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/60 px-6"
          onPress={() => setShowLogoutConfirm(false)}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="w-full gap-4 rounded-2xl bg-zinc-900 p-6"
          >
            <ThemedText variant="lg" weight="medium">
              Log out
            </ThemedText>

            <ThemedText variant="sm" className="text-zinc-400">
              Are you sure you want to log out?
            </ThemedText>

            <View className="flex-row gap-3">
              <Button
                title="Cancel"
                variant="outline-dark"
                onPress={() => setShowLogoutConfirm(false)}
                disabled={logoutMutation.isPending}
                className="flex-1"
              />
              <Button
                title={logoutMutation.isPending ? "Logging out..." : "Log out"}
                variant="danger"
                onPress={onConfirmLogout}
                loading={logoutMutation.isPending}
                className="flex-1"
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

type RowProps = {
  label: string;
  value?: string;
  onPress: () => void;
};

function Row({ label, value, onPress }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-2xl bg-zinc-900 px-4 py-4 active:bg-zinc-800"
    >
      <ThemedText variant="md">{label}</ThemedText>
      <View className="flex-row items-center gap-2">
        {value && (
          <ThemedText variant="sm" className="text-zinc-400" numberOfLines={1}>
            {value}
          </ThemedText>
        )}
        <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#71717a" />
      </View>
    </Pressable>
  );
}
