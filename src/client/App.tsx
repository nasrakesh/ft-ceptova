import { useEffect, useState } from "react";
import { api, type User } from "./api";
import Auth from "./pages/Auth";
import DailyLog from "./pages/DailyLog";
import Settings from "./pages/Settings";
import Insights from "./components/Insights";
import { LogIcon, SettingsIcon, ChartIcon } from "./icons";

type Tab = "log" | "insights" | "settings";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>("log");

  function switchTab(next: Tab) {
    setTab(next);
    document.querySelector(".app-body")?.scrollTo(0, 0);
  }

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
        <span className="app-bar-title">
          <span className="app-bar-logo" aria-hidden="true">🥗</span>
          Nutrition Tracker
        </span>
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
        {tab === "log" && <DailyLog />}
        {tab === "insights" && (
          <div className="settings-screen">
            <Insights />
          </div>
        )}
        {tab === "settings" && <Settings />}
      </div>

      <nav className="bottom-nav">
        <button
          type="button"
          className={tab === "log" ? "nav-btn active" : "nav-btn"}
          onClick={() => switchTab("log")}
        >
          <LogIcon active={tab === "log"} />
          <span>Log</span>
        </button>
        <button
          type="button"
          className={tab === "insights" ? "nav-btn active" : "nav-btn"}
          onClick={() => switchTab("insights")}
        >
          <ChartIcon size={20} />
          <span>Insights</span>
        </button>
        <button
          type="button"
          className={tab === "settings" ? "nav-btn active" : "nav-btn"}
          onClick={() => switchTab("settings")}
        >
          <SettingsIcon active={tab === "settings"} />
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
}
