import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View, Text } from 'react-native';
import { Link, router } from 'expo-router';
import { useRegisterMutation } from '@/modules/auth/services/auth.mutation';
import { registerSchema, RegisterValues } from '@/modules/auth/validations/auth';
import { Button } from '@/modules/shared/components/button';
import { Input } from '@/modules/shared/components/input';

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
    <View className="flex-1 justify-center items-center bg-black p-4">
      <View className="w-full max-w-md gap-6">
        <View className="items-center gap-2">
          <Text className="font-google-sans-bold text-2xl text-white">
            Register
          </Text>
          <Text className="font-google-sans text-sm text-[#B0B4BA] text-center">
            Create a new account on the Knowledge Platform.
          </Text>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCapitalize="words"
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
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
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
                error={errors.password?.message}
              />
            )}
          />

          {registerMutation.error && (
            <View className="bg-red-900/20 p-3 rounded-lg border border-red-900/50">
              <Text className="font-google-sans text-sm text-red-400">
                {(registerMutation.error as any).message || 'Registration failed. Please try again.'}
              </Text>
            </View>
          )}

          <Button
            title={registerMutation.isPending ? 'Signing Up...' : 'Sign Up'}
            onPress={handleSubmit(onSubmit)}
            loading={registerMutation.isPending}
            className="mt-2"
          />
        </View>
      </View>

      <View className="flex-row justify-center mt-6 gap-2">
        <Text className="font-google-sans text-sm text-[#B0B4BA]">Already have an account?</Text>
        <Link href="/(auth)/login" asChild>
          <Text className="font-google-sans-medium text-sm text-white">
            Sign In
          </Text>
        </Link>
      </View>
    </View>
  );
}
