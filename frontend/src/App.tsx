import { useEffect } from "react";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

declare global {
  interface Window { Telegram?: { WebApp?: { ready: () => void; expand: () => void; colorScheme: string } } }
}

export default function App() {
  const { checking, connected, user, refresh, logout } = useAuth();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) { try { tg.ready(); tg.expand(); } catch { /* noop */ } }
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return connected
    ? <Dashboard user={user} onLogout={logout} />
    : <Login onConnected={refresh} />;
}
