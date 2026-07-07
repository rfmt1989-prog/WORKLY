import { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { useColors } from "@/src/theme/theme";

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const c = useColors();

  useEffect(() => {
    if (loading) return;
    if (user) router.replace("/(tabs)");
    else router.replace("/login");
  }, [user, loading]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.surface }}>
      <Text style={{ color: c.onSurface, fontSize: 34, fontWeight: "800", letterSpacing: -1, marginBottom: 20 }}>
        WORKLY
      </Text>
      <ActivityIndicator color={c.onSurface} />
    </View>
  );
}
