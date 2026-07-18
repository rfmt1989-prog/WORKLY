import React, { PropsWithChildren } from "react";
import { View, ViewProps } from "react-native";

import { colors, radius, spacing } from "../../design";

type SurfaceProps = PropsWithChildren<ViewProps>;

export function Surface({ children, style, ...props }: SurfaceProps) {
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.large,
          padding: spacing[4],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}