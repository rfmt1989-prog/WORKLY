import React, { type ReactNode } from "react";
import {
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

import {
  colors,
  spacing,
} from "@/src/design";

type DashboardShellProps = {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export default function DashboardShell({
  children,
  refreshing = false,
  onRefresh,
}: DashboardShellProps) {
  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        paddingHorizontal: spacing[4],
        paddingTop: spacing[4],
        paddingBottom: spacing[16],
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.worker}
            colors={[colors.worker]}
          />
        ) : undefined
      }
    >
      <View
        style={{
          width: "100%",
          maxWidth: 1400,
        }}
      >
        {children}
      </View>
    </ScrollView>
  );
}