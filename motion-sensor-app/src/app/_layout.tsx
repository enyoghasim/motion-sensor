import { useCurrentUserQuery } from "@/modules/auth/services/auth.query";
import { getQueryClient } from "@/modules/shared/services/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Slot, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Toaster } from "sonner-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import "../global.css";

SplashScreen.preventAutoHideAsync();

function AppGate() {
  const { isLoading } = useCurrentUserQuery();

  return (
    <>
      <AnimatedSplashOverlay ready={!isLoading} />
      {/* <Slot /> */}
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </>
  );
}

export default function TabLayout() {
  const queryClient = getQueryClient();

  const [fontsLoaded] = useFonts({
    "Google Sans Thin": require("../../assets/fonts/GoogleSans-Thin.ttf"),
    "Google Sans ExtraLight": require("../../assets/fonts/GoogleSans-ExtraLight.ttf"),
    "Google Sans Light": require("../../assets/fonts/GoogleSans-Light.ttf"),
    "Google Sans": require("../../assets/fonts/GoogleSans-Regular.ttf"),
    "Google Sans Medium": require("../../assets/fonts/GoogleSans-Medium.ttf"),
    "Google Sans SemiBold": require("../../assets/fonts/GoogleSans-SemiBold.ttf"),
    "Google Sans Bold": require("../../assets/fonts/GoogleSans-Bold.ttf"),
    "Google Sans ExtraBold": require("../../assets/fonts/GoogleSans-ExtraBold.ttf"),
    "Google Sans Black": require("../../assets/fonts/GoogleSans-Black.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppGate />
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
