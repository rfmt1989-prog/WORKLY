import React from "react";
import { Platform, Pressable, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/src/theme/theme";

export default function TabsLayout() {
  const c = useColors();

  const icon = (name: keyof typeof Ionicons.glyphMap, outline: keyof typeof Ionicons.glyphMap) => {
    function TabIcon({ focused, color, size }: { focused: boolean; color: string; size: number }) {
      return <Ionicons name={focused ? name : outline} size={size} color={color} />;
    }
    return TabIcon;
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.onSurface,
        tabBarInactiveTintColor: c.muted,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: c.border,
          backgroundColor: Platform.OS === "android" ? c.surface : "transparent",
          elevation: 0,
          height: 60 + (Platform.OS === "ios" ? 24 : 8),
          paddingTop: 8,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView intensity={80} tint={c.isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : null,
        tabBarButton: (props) => (
          <PressableTab {...props} />
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("home", "home-outline") }} />
      <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: icon("search", "search-outline") }} />
      <Tabs.Screen name="messages" options={{ title: "Messages", tabBarIcon: icon("chatbubble", "chatbubble-outline") }} />
      <Tabs.Screen name="contracts" options={{ title: "Contracts", tabBarIcon: icon("document-text", "document-text-outline") }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: icon("person", "person-outline") }} />
    </Tabs>
  );
}

function PressableTab({ onPress, ...props }: any) {
  return (
    <Pressable
      {...props}
      onPress={(e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
    />
  );
}
