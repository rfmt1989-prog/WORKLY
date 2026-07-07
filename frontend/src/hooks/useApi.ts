import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { api } from "@/src/api/client";

export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get<T>(path);
      setData(res);
    } catch (e: any) {
      setError(e.message || "Erro");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { data, loading, error, reload: load, setData };
}
