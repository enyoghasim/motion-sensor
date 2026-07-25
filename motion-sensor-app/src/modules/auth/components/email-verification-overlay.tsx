import {
  useRequestEmailVerificationMutation,
  useVerifyEmailMutation,
} from "@/modules/auth/services/auth.mutation";
import {
  EmailVerificationValues,
  emailVerificationSchema,
} from "@/modules/auth/validations/auth";
import { Button } from "@/modules/shared/components/button";
import { ErrorMessage } from "@/modules/shared/components/error-message";
import { Input } from "@/modules/shared/components/input";
import { ThemedText } from "@/modules/shared/components/themed-text";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailAtSign01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type EmailVerificationOverlayProps = {
  email: string;
};

export function EmailVerificationOverlay({
  email,
}: EmailVerificationOverlayProps) {
  const [resendSuccess, setResendSuccess] = useState(false);

  const verifyMutation = useVerifyEmailMutation();
  const resendMutation = useRequestEmailVerificationMutation();

  const form = useForm<EmailVerificationValues>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: { otp: "" },
  });

  const onSubmit = (data: EmailVerificationValues) => {
    verifyMutation.mutate(data.otp);
  };

  const onResend = () => {
    setResendSuccess(false);
    resendMutation.mutate(undefined, {
      onSuccess: () => setResendSuccess(true),
    });
  };

  return (
    <Modal
      visible
      animationType="fade"
      transparent={false}
      onRequestClose={() => {}}
    >
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-black">
        <View className="flex-1 px-6 pt-16">
          <View className="items-center mb-8">
            <View className="w-16 h-16 rounded-full bg-white/10 items-center justify-center mb-6">
              <HugeiconsIcon icon={MailAtSign01Icon} size={28} color="#ffffff" />
            </View>
            <ThemedText variant="title" className="mb-2 text-center">
              Verify your email
            </ThemedText>
            <ThemedText variant="md" className="text-[#B0B4BA] text-center">
              We sent a 6-digit code to {email}. Enter it below to continue.
            </ThemedText>
          </View>

          {verifyMutation.error && (
            <ErrorMessage
              message={verifyMutation.error.errors}
              fallback="Invalid or expired code. Please try again."
            />
          )}

          {resendMutation.error && (
            <ErrorMessage
              message={resendMutation.error.errors}
              fallback="Couldn't resend the code. Please try again."
            />
          )}

          {resendSuccess && !resendMutation.error && (
            <View className="bg-white/5 p-3 rounded-lg border border-white/10 mb-4">
              <ThemedText variant="sm" className="text-[#B0B4BA]">
                A new code has been sent to {email}.
              </ThemedText>
            </View>
          )}

          <View className="gap-3">
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

            <Pressable
              className="self-end"
              onPress={onResend}
              disabled={resendMutation.isPending}
              hitSlop={8}
            >
              <ThemedText variant="md">
                {resendMutation.isPending ? "Sending..." : "Resend code"}
              </ThemedText>
            </Pressable>

            <Button
              title={verifyMutation.isPending ? "Verifying..." : "Verify"}
              onPress={form.handleSubmit(onSubmit)}
              loading={verifyMutation.isPending}
              className="mt-8"
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
