import { useLoginMutation } from "@/modules/auth/services/auth.mutation";
import { loginSchema, LoginValues } from "@/modules/auth/validations/auth";
import { Button } from "@/modules/shared/components/button";
import { ErrorMessage } from "@/modules/shared/components/error-message";
import { Input } from "@/modules/shared/components/input";
import { ThemedText } from "@/modules/shared/components/themed-text";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Link, router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const {
    mutate: login,
    error: loginError,
    isPending: isLoggingIn,
  } = useLoginMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginValues) => login(data);

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
          Welcome back
        </ThemedText>

        {loginError && (
          <ErrorMessage
            message={loginError?.errors}
            fallback="Login failed. Please check your credentials."
          />
        )}

        <View className="gap-3">
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
            className="self-end"
            onPress={() => router.push("/(auth)/forgot-password")}
          >
            <ThemedText variant="lg" className="mt-5">
              Forgot password?
            </ThemedText>
          </Pressable>

          <Button
            title={isLoggingIn ? "Signing In..." : "Log in"}
            onPress={handleSubmit(onSubmit)}
            loading={isLoggingIn}
            className="mt-8"
          />
        </View>
      </View>

      <View className="flex-row justify-center pb-6 gap-2">
        <ThemedText variant="lg" className="text-[#B0B4BA]">
          Don't have an account?
        </ThemedText>
        <Link href="/(auth)/register" asChild>
          <ThemedText variant="lg" weight="medium">
            Sign Up
          </ThemedText>
        </Link>
      </View>
    </SafeAreaView>
  );
}
