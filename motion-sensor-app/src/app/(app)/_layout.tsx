import { Redirect } from 'expo-router';
import { getAccessToken } from '@/modules/auth/services/auth-storage';
import AppTabs from '@/components/app-tabs';

export default function AppLayout() {
  const token = getAccessToken();

  if (!token) {
    // If not authenticated, redirect to login
    return <Redirect href="/(auth)/login" />;
  }

  // Render the tabs if authenticated
  return <AppTabs />;
}
