import React from "react";
import { View } from "react-native";

type Props = {
  children: React.ReactNode;
};

export default function TeamArena({ children }: Props) {
  return (
    <View
      style={{
        width: "100%",
        minHeight: 500,
        borderRadius: 30,
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        padding: 30,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {children}
    </View>
  );
}