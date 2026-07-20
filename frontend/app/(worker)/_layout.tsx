import React from "react";
import { Stack } from "expo-router";

export default function WorkerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: "#03060C" },
      }}
    />
  );
}
