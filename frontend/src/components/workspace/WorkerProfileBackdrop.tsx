import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Rect } from "react-native-svg";

// Architectural technical grid on the same midnight backdrop as the entry screen.
export function WorkerProfileBackdrop() {
  return (
    <View pointerEvents="none" accessibilityElementsHidden style={StyleSheet.absoluteFill}>
      <LinearGradient colors={["#07090E", "#0A0D15", "#080A10"]} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height="100%" viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice">
        <Rect width="1440" height="1000" fill="transparent" />
        <Path d="M0 90 H1440 M0 270 H1440 M0 450 H1440 M0 630 H1440 M0 810 H1440 M180 0 V1000 M420 0 V1000 M660 0 V1000 M900 0 V1000 M1140 0 V1000 M1380 0 V1000" stroke="#426077" strokeWidth="1" opacity=".18" fill="none" />
        <Path d="M0 770 L270 610 L470 695 L730 440 L930 555 L1170 330 L1440 455" stroke="#87BFD5" strokeWidth="1.5" opacity=".17" fill="none" />
        <Path d="M0 0 H360 L0 260 Z" fill="#183047" opacity=".20" />
        <Path d="M1160 1000 L1440 750 V1000 Z" fill="#24445A" opacity=".14" />
      </Svg>
    </View>
  );
}
