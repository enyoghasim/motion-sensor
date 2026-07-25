import { useCurrentUserQuery } from '@/modules/auth/services/auth.query';
import { router, Stack } from 'expo-router';
import { useEffect } from 'react';

export default function AuthLayout() {
  const { data: user, isLoading } = useCurrentUserQuery();

  useEffect(() => {
    if (isLoading || !user) return;
    router.replace('/(app)/(spaces)');
  }, [isLoading, user]);

  if (isLoading || user) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
