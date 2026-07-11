import { Slot } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/modules/shared/services/query-client';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const queryClient = getQueryClient();

  const [fontsLoaded] = useFonts({
    'Google Sans Thin': require('../../assets/fonts/GoogleSans-Thin.ttf'),
    'Google Sans ExtraLight': require('../../assets/fonts/GoogleSans-ExtraLight.ttf'),
    'Google Sans Light': require('../../assets/fonts/GoogleSans-Light.ttf'),
    'Google Sans': require('../../assets/fonts/GoogleSans-Regular.ttf'),
    'Google Sans Medium': require('../../assets/fonts/GoogleSans-Medium.ttf'),
    'Google Sans SemiBold': require('../../assets/fonts/GoogleSans-SemiBold.ttf'),
    'Google Sans Bold': require('../../assets/fonts/GoogleSans-Bold.ttf'),
    'Google Sans ExtraBold': require('../../assets/fonts/GoogleSans-ExtraBold.ttf'),
    'Google Sans Black': require('../../assets/fonts/GoogleSans-Black.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AnimatedSplashOverlay />
      <Slot />
    </QueryClientProvider>
  );
}
