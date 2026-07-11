import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/modules/shared/components/themed-text";

export default function AutomationScreen() {
  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1 items-center justify-center px-6">
        <ThemedText variant="title">Automation</ThemedText>
      </SafeAreaView>
    </View>
  );
}
