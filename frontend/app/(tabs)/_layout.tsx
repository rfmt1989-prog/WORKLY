import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
} from "react-native";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/src/theme/theme";

type IconName = keyof typeof Ionicons.glyphMap;

function createTabIcon(
  name: IconName,
  outline: IconName
) {
  function TabIcon({
    focused,
    color,
    size,
  }: {
    focused: boolean;
    color: string;
    size: number;
  }) {
    return (
      <Ionicons
        name={focused ? name : outline}
        size={size}
        color={color}
      />
    );
  }

  return TabIcon;
}

export default function TabsLayout() {
  const c = useColors();

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
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: createTabIcon("home", "home-outline") }} />
      <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: createTabIcon("search", "search-outline") }} />
      <Tabs.Screen name="messages" options={{ title: "Messages", tabBarIcon: createTabIcon("chatbubble", "chatbubble-outline") }} />
      <Tabs.Screen name="contracts" options={{ title: "Contracts", tabBarIcon: createTabIcon("document-text", "document-text-outline") }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: createTabIcon("person", "person-outline") }} />
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
