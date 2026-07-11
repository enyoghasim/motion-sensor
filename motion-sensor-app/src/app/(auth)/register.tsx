import { useRegisterMutation } from "@/modules/auth/services/auth.mutation";
import {
  registerSchema,
  RegisterValues,
} from "@/modules/auth/validations/auth";
import { Button } from "@/modules/shared/components/button";
import { ErrorMessage } from "@/modules/shared/components/error-message";
import { Input } from "@/modules/shared/components/input";
import { cn } from "@/modules/shared/lib/util";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const registerMutation = useRegisterMutation();
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

  const onSubmit = (data: RegisterValues) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        router.replace("/(app)");
      },
      onError: (error: any) => {
        console.error("Registration failed", error);
      },
    });
  };

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
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          className="font-google-sans-bold text-4xl text-white mb-8"
        >
          Create account
        </Text>

        {registerMutation.error && (
          <ErrorMessage
            message={(registerMutation.error as any).message}
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
            <Text className="flex-1 font-google-sans text-[#B0B4BA]">
              I have read and agree to the{" "}
              <Text className="font-google-sans-medium text-white">
                Terms of Use
              </Text>{" "}
              &{" "}
              <Text className="font-google-sans-medium text-white">
                Privacy Policy
              </Text>
            </Text>
          </Pressable>

          <Button
            title={registerMutation.isPending ? "Signing Up..." : "Sign Up"}
            onPress={handleSubmit(onSubmit)}
            loading={registerMutation.isPending}
            disabled={!agreedToTerms}
            className="mt-8"
          />
        </View>
      </View>

      <View className="flex-row justify-center pb-6 gap-2">
        <Text className="font-google-sans text-[#B0B4BA]">
          Already have an account?
        </Text>
        <Link href="/(auth)/login" asChild>
          <Text className="font-google-sans-medium text-white">Sign In</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}
