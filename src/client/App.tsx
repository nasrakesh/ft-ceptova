import { useEffect, useState } from "react";
import { api, type User } from "./api";
import Auth from "./pages/Auth";
import DailyLog from "./pages/DailyLog";
import Settings from "./pages/Settings";

function LogIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--accent)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--accent)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<"log" | "settings">("log");

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  if (checking) return <div className="loading-screen">Loading…</div>;

  if (!user) return <Auth onAuthed={setUser} />;

  return (
    <div className="app-shell">
      <header className="app-bar">
        <span className="app-bar-title">Nutrition Tracker</span>
        <div className="app-bar-right">
          <span className="user-email">{user.email}</span>
          <button
            type="button"
            className="link-btn"
            onClick={async () => {
              await api.logout().catch(() => {});
              setUser(null);
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <div className="app-body">
        {tab === "log" ? <DailyLog /> : <Settings />}
      </div>

      <nav className="bottom-nav">
        <button
          type="button"
          className={tab === "log" ? "nav-btn active" : "nav-btn"}
          onClick={() => setTab("log")}
        >
          <LogIcon active={tab === "log"} />
          <span>Log</span>
        </button>
        <button
          type="button"
          className={tab === "settings" ? "nav-btn active" : "nav-btn"}
          onClick={() => setTab("settings")}
        >
          <SettingsIcon active={tab === "settings"} />
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
}
