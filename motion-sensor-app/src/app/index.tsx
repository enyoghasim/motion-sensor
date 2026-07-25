import { useCurrentUserQuery } from "@/modules/auth/services/auth.query";
import { Redirect } from "expo-router";

const AppIndex = () => {
  const { data: user, isLoading } = useCurrentUserQuery();

  if (isLoading) return null;

  if (user) {
    return <Redirect href="/(app)/(spaces)" />;
  }

  return <Redirect href="/(auth)/login" />;
};

export default AppIndex;
