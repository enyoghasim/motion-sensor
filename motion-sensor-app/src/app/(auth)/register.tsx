import { useRegisterMutation } from "@/modules/auth/services/auth.mutation";
import {
  registerSchema,
  RegisterValues,
} from "@/modules/auth/validations/auth";
import { Button } from "@/modules/shared/components/button";
import { ErrorMessage } from "@/modules/shared/components/error-message";
import { Input } from "@/modules/shared/components/input";
import { ThemedText } from "@/modules/shared/components/themed-text";
import { cn } from "@/modules/shared/lib/util";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const {
    mutate: register,
    error: registerError,
    isPending: isRegistering,
  } = useRegisterMutation();
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: RegisterValues) => register(data);

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-black">
      <View className="px-6">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 items-center justify-center -ml-2"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={28} color="#ffffff" />
        </Pressable>
      </View>

      <View className="flex-1 px-6 pt-6">
        <ThemedText
          numberOfLines={1}
          adjustsFontSizeToFit
          variant="title"
          className="mb-8"
        >
          Create account
        </ThemedText>

        {registerError && (
          <ErrorMessage
            message={registerError?.errors}
            fallback="Registration failed. Please try again."
          />
        )}

        <View className="gap-3">
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Enter full name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCapitalize="words"
                error={errors.name?.message}
                size="lg"
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Enter email"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCapitalize="none"
                keyboardType="email-address"
                error={errors.email?.message}
                size="lg"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Enter password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
                error={errors.password?.message}
                size="lg"
              />
            )}
          />

          <Pressable
            onPress={() => setAgreedToTerms((prev) => !prev)}
            className="flex-row items-start gap-3"
            hitSlop={4}
          >
            <View
              className={cn(
                "w-5 h-5 rounded border items-center justify-center mt-0.5",
                agreedToTerms ? "bg-white border-white" : "border-[#71717a]",
              )}
            >
              {agreedToTerms && (
                <HugeiconsIcon icon={Tick02Icon} size={14} color="#000000" />
              )}
            </View>
            <ThemedText variant="md" className="flex-1 text-[#B0B4BA]">
              I have read and agree to the{" "}
              <ThemedText variant="md" weight="medium">
                Terms of Use
              </ThemedText>{" "}
              &{" "}
              <ThemedText variant="md" weight="medium">
                Privacy Policy
              </ThemedText>
            </ThemedText>
          </Pressable>

          <Button
            title={isRegistering ? "Signing Up..." : "Sign Up"}
            onPress={handleSubmit(onSubmit)}
            loading={isRegistering}
            disabled={!agreedToTerms}
            className="mt-8"
          />
        </View>
      </View>

      <View className="flex-row justify-center pb-6 gap-2">
        <ThemedText variant="md" className="text-[#B0B4BA]">
          Already have an account?
        </ThemedText>
        <Link href="/(auth)/login" asChild>
          <ThemedText variant="md" weight="medium">
            Sign In
          </ThemedText>
        </Link>
      </View>
    </SafeAreaView>
  );
}
