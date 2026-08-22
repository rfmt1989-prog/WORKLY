import React, { useEffect } from "react";

import { useAuth } from "@/src/context/AuthContext";

export function SessionRefreshGate({ children }: { children: React.ReactNode }) {
  const { token, refresh } = useAuth();

  useEffect(() => {
    if (!token) return;
    void refresh();
  }, [refresh, token]);

  return <>{children}</>;
}
