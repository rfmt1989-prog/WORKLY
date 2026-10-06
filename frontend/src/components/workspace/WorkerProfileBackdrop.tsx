import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

// A light, local vector backdrop keeps the same atmosphere on web and mobile.
export function WorkerProfileBackdrop() {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      style={StyleSheet.absoluteFill}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 1440 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <LinearGradient id="workerMist" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#14212D" stopOpacity="0.1" />
            <Stop offset="1" stopColor="#11283B" stopOpacity="0.45" />
          </LinearGradient>
        </Defs>
        <Rect width="1440" height="1000" fill="url(#workerMist)" />
        <Path
          d="M0 780 L220 430 L310 535 L450 315 L590 575 L730 395 L890 620 L1060 390 L1210 565 L1440 365 L1440 1000 L0 1000Z"
          fill="#263846"
          opacity="0.12"
        />
        <Path
          d="M0 870 L250 640 L440 800 L620 550 L830 825 L1100 610 L1440 810 L1440 1000 L0 1000Z"
          fill="#314957"
          opacity="0.1"
        />
        <Path
          d="M45 1000V670M45 675L8 740H28L0 790H30L5 840H65L40 790H78L52 740H70Z M1380 1000V560M1380 565L1340 640H1360L1320 720H1362L1318 800H1440L1399 720H1440L1400 640H1423Z M120 1000V760M120 765L82 830H100L63 900H170L140 830H158Z"
          fill="#081019"
          opacity="0.6"
        />
      </Svg>
    </View>
  );
}
