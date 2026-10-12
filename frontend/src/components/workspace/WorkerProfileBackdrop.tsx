import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

// Clean, low-contrast architectural guide lines — never a dark overlay on content.
export function WorkerProfileBackdrop() {
  return (
    <View pointerEvents="none" accessibilityElementsHidden style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice">
        <Rect width="1440" height="1000" fill="#F5F3EE" />
        <Path d="M0 90 H1440 M0 260 H1440 M0 430 H1440 M0 600 H1440 M0 770 H1440 M0 940 H1440 M180 0 V1000 M420 0 V1000 M660 0 V1000 M900 0 V1000 M1140 0 V1000 M1380 0 V1000" stroke="#E4DFD7" strokeWidth="1" opacity=".34" fill="none" />
        <Path d="M0 765 L275 590 L450 665 L725 450 L910 540 L1175 350 L1440 480" stroke="#D9B49F" strokeWidth="1.5" opacity=".16" fill="none" />
        <Path d="M1320 0 L1440 0 L1440 190 Z" fill="#E9DCD0" opacity=".25" />
      </Svg>
    </View>
  );
}
