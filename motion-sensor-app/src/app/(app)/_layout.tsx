import { Redirect, Stack } from "expo-router";

import { EmailVerificationOverlay } from "@/modules/auth/components/email-verification-overlay";
import { useCurrentUserQuery } from "@/modules/auth/services/auth.query";

export default function AppLayout() {
  const { data: user, isLoading } = useCurrentUserQuery();

  if (isLoading) return null;

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="spaces" />
      </Stack>
      {!user.email_verified && (
        <EmailVerificationOverlay email={user.email} />
      )}
    </>
  );
}
