import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Link, router } from 'expo-router';
import { useRegisterMutation } from '@/modules/auth/services/auth.mutation';
import { registerSchema, RegisterValues } from '@/modules/auth/validations/auth';

export default function RegisterScreen() {
  const registerMutation = useRegisterMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: RegisterValues) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        router.replace('/(app)');
      },
      onError: (error: any) => {
        console.error('Registration failed', error);
      },
    });
  };

  return (
    <View className="flex-1 justify-center items-center bg-zinc-950 p-4">
      <View className="w-full max-w-md p-6 bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 flex flex-col gap-6">
        <View className="flex flex-col items-center gap-2">
          <Text className="text-2xl font-bold text-zinc-50">
            Register
          </Text>
          <Text className="text-sm text-zinc-500 text-center">
            Create a new account on the Knowledge Platform.
          </Text>
        </View>

        <View className="flex flex-col gap-4">
          <View className="flex flex-col gap-2">
            <Text className="text-sm font-medium text-zinc-300">Full Name</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="John Doe"
                  placeholderTextColor="#a1a1aa"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  autoCapitalize="words"
                  className={`w-full rounded-lg border px-3 py-2.5 text-base bg-zinc-800 text-zinc-50 ${
                    errors.name ? 'border-red-500' : 'border-zinc-700'
                  }`}
                />
              )}
            />
            {errors.name && (
              <Text className="text-xs text-red-500">{errors.name.message}</Text>
            )}
          </View>

          <View className="flex flex-col gap-2">
            <Text className="text-sm font-medium text-zinc-300">Email</Text>
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
                  className={`w-full rounded-lg border px-3 py-2.5 text-base bg-zinc-800 text-zinc-50 ${
                    errors.email ? 'border-red-500' : 'border-zinc-700'
                  }`}
                />
              )}
            />
            {errors.email && (
              <Text className="text-xs text-red-500">{errors.email.message}</Text>
            )}
          </View>

          <View className="flex flex-col gap-2">
            <Text className="text-sm font-medium text-zinc-300">Password</Text>
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
                  className={`w-full rounded-lg border px-3 py-2.5 text-base bg-zinc-800 text-zinc-50 ${
                    errors.password ? 'border-red-500' : 'border-zinc-700'
                  }`}
                />
              )}
            />
            {errors.password && (
              <Text className="text-xs text-red-500">{errors.password.message}</Text>
            )}
          </View>

          {registerMutation.error && (
            <View className="bg-red-900/20 p-3 rounded-lg border border-red-900/50">
              <Text className="text-sm text-red-400">
                {(registerMutation.error as any).message || 'Registration failed. Please try again.'}
              </Text>
            </View>
          )}

          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={registerMutation.isPending}
            className="mt-2 items-center rounded-lg bg-blue-600 py-3 active:bg-blue-700 disabled:opacity-50"
          >
            <Text className="text-base font-medium text-white">
              {registerMutation.isPending ? 'Signing Up...' : 'Sign Up'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="flex flex-row justify-center mt-6 gap-2">
        <Text className="text-sm text-zinc-500">Already have an account?</Text>
        <Link href="/(auth)/login" asChild>
          <Text className="text-sm font-medium text-blue-600">
            Sign In
          </Text>
        </Link>
      </View>
    </View>
  );
}
