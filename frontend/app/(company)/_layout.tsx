import React from "react";
import { Stack } from "expo-router";

export default function CompanyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: "#05070A" },
      }}
    />
  );
}
