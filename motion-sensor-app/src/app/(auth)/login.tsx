import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View, Text } from 'react-native';
import { Link, router } from 'expo-router';
import { useLoginMutation } from '@/modules/auth/services/auth.mutation';
import { loginSchema, LoginValues } from '@/modules/auth/validations/auth';
import { Button } from '@/modules/shared/components/button';
import { Input } from '@/modules/shared/components/input';

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
    <View className="flex-1 justify-center items-center bg-black p-4">
      <View className="w-full max-w-md gap-6">
        <View className="items-center gap-2">
          <Text className="font-google-sans-bold text-2xl text-white">
            Sign In
          </Text>
          <Text className="font-google-sans text-sm text-[#B0B4BA] text-center">
            Welcome back to the Knowledge Platform.
          </Text>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="user@example.com"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCapitalize="none"
                keyboardType="email-address"
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Enter your password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
                error={errors.password?.message}
              />
            )}
          />

          {loginMutation.error && (
            <View className="bg-red-900/20 p-3 rounded-lg border border-red-900/50">
              <Text className="font-google-sans text-sm text-red-400">
                {(loginMutation.error as any).message || 'Login failed. Please check your credentials.'}
              </Text>
            </View>
          )}

          <Button
            title={loginMutation.isPending ? 'Signing In...' : 'Sign In'}
            onPress={handleSubmit(onSubmit)}
            loading={loginMutation.isPending}
            className="mt-2"
          />
        </View>
      </View>

      <View className="flex-row justify-center mt-6 gap-2">
        <Text className="font-google-sans text-sm text-[#B0B4BA]">Don't have an account?</Text>
        <Link href="/(auth)/register" asChild>
          <Text className="font-google-sans-medium text-sm text-white">
            Sign Up
          </Text>
        </Link>
      </View>
    </View>
  );
}
