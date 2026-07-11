import {
  useRequestPasswordResetMutation,
  useVerifyPasswordResetMutation,
} from "@/modules/auth/services/auth.mutation";
import {
  ForgotPasswordValues,
  forgotPasswordSchema,
  ResetPasswordValues,
  resetPasswordSchema,
} from "@/modules/auth/validations/auth";
import { Button } from "@/modules/shared/components/button";
import { ErrorMessage } from "@/modules/shared/components/error-message";
import { Input } from "@/modules/shared/components/input";
import { ThemedText } from "@/modules/shared/components/themed-text";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Step = "email" | "reset" | "done";

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);

  const requestMutation = useRequestPasswordResetMutation();
  const verifyMutation = useVerifyPasswordResetMutation();

  const emailForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { otp: "", newPassword: "", confirmPassword: "" },
  });

  const onRequestSubmit = (data: ForgotPasswordValues) => {
    requestMutation.mutate(data, {
      onSuccess: (res) => {
        setEmail(data.email);
        setRequestId(res.request_id);
        setStep("reset");
      },
    });
  };

  const onResendCode = () => {
    if (!email) return;
    requestMutation.mutate(
      { email },
      {
        onSuccess: (res) => {
          setRequestId(res.request_id);
        },
      },
    );
  };

  const onResetSubmit = (data: ResetPasswordValues) => {
    if (!requestId) return;
    verifyMutation.mutate(
      {
        requestId,
        otp: data.otp,
        newPassword: data.newPassword,
      },
      {
        onSuccess: () => setStep("done"),
      },
    );
  };

  const handleBack = () => {
    if (step === "reset") {
      setStep("email");
      return;
    }
    if (step === "done") {
      router.replace("/(auth)/login");
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-black">
      <View className="px-6">
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          className="w-10 h-10 items-center justify-center -ml-2"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={28} color="#ffffff" />
        </Pressable>
      </View>

      <View className="flex-1 px-6 pt-6">
        {step === "email" && (
          <>
            <ThemedText
              numberOfLines={1}
              adjustsFontSizeToFit
              variant="title"
              className="mb-2"
            >
              Reset password
            </ThemedText>
            <ThemedText variant="md" className="text-[#B0B4BA] mb-8">
              Enter the email linked to your account and we'll send you a
              code to reset your password.
            </ThemedText>

            {requestMutation.error && (
              <ErrorMessage
                message={requestMutation.error.message}
                fallback="Something went wrong. Please try again."
              />
            )}

            <View className="gap-3">
              <Controller
                control={emailForm.control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Enter email"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    error={emailForm.formState.errors.email?.message}
                    size="lg"
                  />
                )}
              />

              <Button
                title={
                  requestMutation.isPending ? "Sending..." : "Send code"
                }
                onPress={emailForm.handleSubmit(onRequestSubmit)}
                loading={requestMutation.isPending}
                className="mt-8"
              />
            </View>
          </>
        )}

        {step === "reset" && (
          <>
            <ThemedText
              numberOfLines={1}
              adjustsFontSizeToFit
              variant="title"
              className="mb-2"
            >
              Enter code
            </ThemedText>
            <ThemedText variant="md" className="text-[#B0B4BA] mb-8">
              We sent a 6-digit code to {email}. Enter it below along with
              your new password.
            </ThemedText>

            {verifyMutation.error && (
              <ErrorMessage
                message={verifyMutation.error.message}
                fallback="Something went wrong. Please try again."
              />
            )}

            <View className="gap-3">
              <Controller
                control={resetForm.control}
                name="otp"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Enter code"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="number-pad"
                    maxLength={6}
                    error={resetForm.formState.errors.otp?.message}
                    size="lg"
                  />
                )}
              />

              <Controller
                control={resetForm.control}
                name="newPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="New password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry
                    error={resetForm.formState.errors.newPassword?.message}
                    size="lg"
                  />
                )}
              />

              <Controller
                control={resetForm.control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Confirm new password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry
                    error={
                      resetForm.formState.errors.confirmPassword?.message
                    }
                    size="lg"
                  />
                )}
              />

              <Pressable
                className="self-end"
                onPress={onResendCode}
                disabled={requestMutation.isPending}
              >
                <ThemedText variant="md">
                  {requestMutation.isPending ? "Sending..." : "Resend code"}
                </ThemedText>
              </Pressable>

              <Button
                title={
                  verifyMutation.isPending ? "Resetting..." : "Reset password"
                }
                onPress={resetForm.handleSubmit(onResetSubmit)}
                loading={verifyMutation.isPending}
                className="mt-8"
              />
            </View>
          </>
        )}

        {step === "done" && (
          <View className="flex-1 items-center justify-center">
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={56}
              color="#ffffff"
            />
            <ThemedText variant="subtitle" className="mt-6 mb-2 text-center">
              Password reset
            </ThemedText>
            <ThemedText variant="md" className="text-[#B0B4BA] text-center mb-8">
              Your password has been reset successfully. You can now sign in
              with your new password.
            </ThemedText>
            <Button
              title="Back to Sign In"
              onPress={() => router.replace("/(auth)/login")}
              className="self-stretch"
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
