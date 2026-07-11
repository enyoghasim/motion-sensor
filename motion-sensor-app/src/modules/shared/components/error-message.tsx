import { Text, View } from "react-native";

type ErrorMessageProps = {
  message?: string;
  fallback: string;
};

export function ErrorMessage({ message, fallback }: ErrorMessageProps) {
  return (
    <View className="bg-red-900/20 p-3 rounded-lg border border-red-900/50 mb-4">
      <Text className="font-google-sans text-sm text-red-400">
        {message || fallback}
      </Text>
    </View>
  );
}
