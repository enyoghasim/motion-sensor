import { useCurrentUserQuery } from "@/modules/auth/services/auth.query";
import OverlayVideo from "@/modules/auth/components/overlay-video";
import { Button } from "@/modules/shared/components/button";
import { Redirect, router } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AppIndex = () => {
  const { data: user, isLoading } = useCurrentUserQuery();

  if (isLoading) return null;

  if (user) {
    return <Redirect href="/(app)/(spaces)" />;
  }

  return (
    <>
      <OverlayVideo />
      <SafeAreaView className="flex-1 justify-end">
        <View className="gap-5 p-5 mb-24">
          <Button title="Log in" onPress={() => router.push("/(auth)/login")} />
          <Button
            title="Create New Account"
            variant="outline-dark"
            onPress={() => router.push("/(auth)/register")}
          />
        </View>
      </SafeAreaView>
    </>
  );
};

export default AppIndex;
