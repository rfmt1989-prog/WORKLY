import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { colors } from "@/src/design";

export default function Index() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.worker} />
      </View>
    );
  }

  if (user?.role === "worker") {
    return <Redirect href={"/(worker)" as never} />;
  }

  if (user?.role === "company") {
    return <Redirect href={"/(company)" as never} />;
  }

  return <Redirect href="/login" />;
}
