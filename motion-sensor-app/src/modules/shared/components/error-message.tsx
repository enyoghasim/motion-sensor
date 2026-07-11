import { View } from "react-native";
import { ThemedText } from "./themed-text";

type ErrorMessageProps = {
  message?: string;
  fallback: string;
};

export function ErrorMessage({ message, fallback }: ErrorMessageProps) {
  return (
    <View className="bg-red-900/20 p-3 rounded-lg border border-red-900/50 mb-4">
      <ThemedText variant="sm" className="text-red-400">
        {message || fallback}
      </ThemedText>
    </View>
  );
}
