import {
  useChangeEmailMutation,
  useLogoutMutation,
  useRequestEmailVerificationMutation,
  useVerifyEmailMutation,
} from "@/modules/auth/services/auth.mutation";
import {
  ChangeEmailValues,
  changeEmailSchema,
  EmailVerificationValues,
  emailVerificationSchema,
} from "@/modules/auth/validations/auth";
import { Button } from "@/modules/shared/components/button";
import { ErrorMessage } from "@/modules/shared/components/error-message";
import { Input } from "@/modules/shared/components/input";
import { ThemedText } from "@/modules/shared/components/themed-text";
import { zodResolver } from "@hookform/resolvers/zod";
import { Logout01Icon, MailAtSign01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { BackHandler, Modal, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

type EmailVerificationOverlayProps = {
  email: string;
};

export function EmailVerificationOverlay({
  email,
}: EmailVerificationOverlayProps) {
  const verifyMutation = useVerifyEmailMutation();
  const resendMutation = useRequestEmailVerificationMutation();
  const changeEmailMutation = useChangeEmailMutation();
  const logoutMutation = useLogoutMutation();

  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const form = useForm<EmailVerificationValues>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: { otp: "" },
  });

  const changeEmailForm = useForm<ChangeEmailValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { email: "" },
  });

  // Non-closable: swallow the Android hardware back button while this is up.
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true,
    );
    return () => subscription.remove();
  }, []);

  const onSubmit = (data: EmailVerificationValues) => {
    verifyMutation.mutate(data.otp, {
      onSuccess: () => toast.success("Email verified"),
    });
  };

  const onResend = () => {
    resendMutation.mutate(undefined, {
      onSuccess: () => toast.success(`A new code has been sent to ${email}`),
      onError: (error) =>
        toast.error(error.message || "Couldn't resend the code."),
    });
  };

  const openChangeEmail = () => {
    changeEmailForm.reset({ email: "" });
    changeEmailMutation.reset();
    setIsChangingEmail(true);
  };

  const closeChangeEmail = () => {
    setIsChangingEmail(false);
    changeEmailMutation.reset();
  };

  const onSubmitChangeEmail = (data: ChangeEmailValues) => {
    changeEmailMutation.mutate(data.email, {
      onSuccess: () => {
        toast.success(`A verification code has been sent to ${data.email}`);
        setIsChangingEmail(false);
      },
    });
  };

  const onConfirmLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <View style={StyleSheet.absoluteFill} className="bg-black z-50">
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-black">
        <View className="flex-row justify-end px-6 pt-4">
          <Pressable
            onPress={() => setShowLogoutConfirm(true)}
            hitSlop={12}
            className="h-9 w-9 items-center justify-center"
          >
            <View pointerEvents="none">
              <HugeiconsIcon
                icon={Logout01Icon}
                size={22}
                className=" text-danger-hover"
                strokeWidth={2}
              />
            </View>
          </Pressable>
        </View>

        <View className="flex-1 px-6 pt-4">
          <View className="items-center mb-8">
            <View className="w-16 h-16 rounded-full bg-white/10 items-center justify-center mb-6">
              <HugeiconsIcon
                icon={MailAtSign01Icon}
                size={28}
                color="#ffffff"
              />
            </View>
            <ThemedText variant="title" className="mb-2 text-center">
              Verify your email
            </ThemedText>
            <ThemedText variant="md" className="text-[#B0B4BA] text-center">
              We sent a 6-digit code to {email}. Enter it below to continue.
            </ThemedText>
          </View>

          {isChangingEmail ? (
            <View key="change-email-panel" className="gap-3">
              {changeEmailMutation.error && (
                <ErrorMessage
                  message={changeEmailMutation.error.errors}
                  fallback="Couldn't update your email. Please try again."
                />
              )}

              <Controller
                control={changeEmailForm.control}
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
                    error={changeEmailForm.formState.errors.email?.message}
                    size="lg"
                  />
                )}
              />

              <View className="flex-row gap-3 mt-8">
                <Button
                  title="Cancel"
                  variant="outline-dark"
                  onPress={closeChangeEmail}
                  disabled={changeEmailMutation.isPending}
                  className="flex-1"
                />
                <Button
                  title={changeEmailMutation.isPending ? "Saving..." : "Save"}
                  onPress={changeEmailForm.handleSubmit(onSubmitChangeEmail)}
                  loading={changeEmailMutation.isPending}
                  className="flex-1"
                />
              </View>
            </View>
          ) : (
            <View key="otp-panel" className="gap-3">
              {verifyMutation.error && (
                <ErrorMessage
                  message={verifyMutation.error.errors}
                  fallback="Invalid or expired code. Please try again."
                />
              )}

              <Controller
                control={form.control}
                name="otp"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Enter code"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="number-pad"
                    maxLength={6}
                    error={form.formState.errors.otp?.message}
                    size="lg"
                  />
                )}
              />

              <View className="flex-row justify-between">
                <Pressable onPress={openChangeEmail} hitSlop={8}>
                  <ThemedText variant="md">Wrong email?</ThemedText>
                </Pressable>

                <Pressable
                  onPress={onResend}
                  disabled={resendMutation.isPending}
                  hitSlop={8}
                >
                  <ThemedText variant="md">
                    {resendMutation.isPending ? "Sending..." : "Resend code"}
                  </ThemedText>
                </Pressable>
              </View>

              <Button
                title={verifyMutation.isPending ? "Verifying..." : "Verify"}
                onPress={form.handleSubmit(onSubmit)}
                loading={verifyMutation.isPending}
                className="mt-8"
              />
            </View>
          )}
        </View>
      </SafeAreaView>

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
