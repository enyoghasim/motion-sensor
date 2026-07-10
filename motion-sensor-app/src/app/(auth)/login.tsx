import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Link, router } from 'expo-router';
import { useLoginMutation } from '@/modules/auth/services/auth.mutation';
import { loginSchema, LoginValues } from '@/modules/auth/validations/auth';

export default function LoginScreen() {
  const loginMutation = useLoginMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginValues) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        router.replace('/(app)');
      },
      onError: (error: any) => {
        console.error('Login failed', error);
      },
    });
  };

  return (
    <View className="flex-1 justify-center items-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <View className="w-full max-w-md p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col gap-6">
        <View className="flex flex-col items-center gap-2">
          <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Sign In
          </Text>
          <Text className="text-sm text-zinc-500 text-center">
            Welcome back to the Knowledge Platform.
          </Text>
        </View>

        <View className="flex flex-col gap-4">
          <View className="flex flex-col gap-2">
            <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="user@example.com"
                  placeholderTextColor="#a1a1aa"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-base text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 ${
                    errors.email ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'
                  }`}
                />
              )}
            />
            {errors.email && (
              <Text className="text-xs text-red-500">{errors.email.message}</Text>
            )}
          </View>

          <View className="flex flex-col gap-2">
            <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor="#a1a1aa"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry
                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-base text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 ${
                    errors.password ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'
                  }`}
                />
              )}
            />
            {errors.password && (
              <Text className="text-xs text-red-500">{errors.password.message}</Text>
            )}
          </View>

          {loginMutation.error && (
            <View className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
              <Text className="text-sm text-red-600 dark:text-red-400">
                {(loginMutation.error as any).message || 'Login failed. Please check your credentials.'}
              </Text>
            </View>
          )}

          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={loginMutation.isPending}
            className="mt-2 items-center rounded-lg bg-blue-600 py-3 active:bg-blue-700 disabled:opacity-50"
          >
            <Text className="text-base font-medium text-white">
              {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="flex flex-row justify-center mt-6 gap-2">
        <Text className="text-sm text-zinc-500">Don't have an account?</Text>
        <Link href="/(auth)/register" asChild>
          <Text className="text-sm font-medium text-blue-600">
            Sign Up
          </Text>
        </Link>
      </View>
    </View>
  );
}
