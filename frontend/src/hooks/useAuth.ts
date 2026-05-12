import { useEffect, useState } from "react";
import { api, getSessionId, setSessionId } from "@/lib/api";

export function useAuth() {
  const [checking, setChecking] = useState(true);
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<{ first_name?: string; username?: string } | null>(null);

  const refresh = async () => {
    const sid = getSessionId();
    if (!sid) {
      setConnected(false);
      setChecking(false);
      return;
    }
    try {
      const { data } = await api.get("/api/health");
      setConnected(!!data.connected);
      setUser(data.user || null);
      if (!data.connected) setSessionId(null);
    } catch {
      setConnected(false);
      setSessionId(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const logout = async () => {
    try {
      await api.post("/api/logout");
    } catch { /* ignore */ }
    setSessionId(null);
    setConnected(false);
    setUser(null);
  };

  return { checking, connected, user, refresh, logout };
}
