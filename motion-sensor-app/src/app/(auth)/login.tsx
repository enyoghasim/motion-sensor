import { useLoginMutation } from "@/modules/auth/services/auth.mutation";
import { loginSchema, LoginValues } from "@/modules/auth/validations/auth";
import { Button } from "@/modules/shared/components/button";
import { ErrorMessage } from "@/modules/shared/components/error-message";
import { Input } from "@/modules/shared/components/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Link, router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const loginMutation = useLoginMutation();

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

  const onSubmit = (data: LoginValues) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        router.replace("/(app)");
      },
      onError: (error: any) => {
        console.error("Login failed", error);
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
          Welcome back
        </Text>

        {loginMutation.error && (
          <ErrorMessage
            message={(loginMutation.error as any).message}
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
            <Text className="font-google-sans text-lg text-white mt-5">
              Forgot password?
            </Text>
          </Pressable>

          <Button
            title={loginMutation.isPending ? "Signing In..." : "Log in"}
            onPress={handleSubmit(onSubmit)}
            loading={loginMutation.isPending}
            className="mt-8"
          />
        </View>
      </View>

      <View className="flex-row justify-center pb-6 gap-2">
        <Text className="font-google-sans text-[#B0B4BA] text-lg">
          Don't have an account?
        </Text>
        <Link href="/(auth)/register" asChild>
          <Text className="font-google-sans-medium text-white text-lg">
            Sign Up
          </Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}
