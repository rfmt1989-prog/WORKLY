import React from "react";
import {
  ActivityIndicator,
  Text,
  View,
} from "react-native";
import { Redirect } from "expo-router";

import { useAuth } from "@/src/context/AuthContext";
import { useColors } from "@/src/theme/theme";

export default function LegacyTabsRedirect() {
  const colors = useColors();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surface,
        }}
      >
        <ActivityIndicator
          size="large"
          color={colors.onSurface}
        />

        <Text
          style={{
            color: colors.muted,
            marginTop: 12,
          }}
        >
          A preparar a tua área...
        </Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role === "worker") {
    return (
      <Redirect href={"/(worker)" as any} />
    );
  }

  return (
    <Redirect href={"/(company)" as any} />
  );
}