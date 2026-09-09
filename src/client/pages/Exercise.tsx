import { useEffect, useState } from "react";
import { api, ACTIVITY_TYPES, type ActivityType, type ExerciseEntry } from "../api";
import ActivityLogPanel from "../components/ActivityLogPanel";
import StrengthProgress from "../components/StrengthProgress";
import ExerciseGuide from "../components/ExerciseGuide";
import WeekStrip from "../components/WeekStrip";
import { todayIso, shiftDate, formatDisplayDate } from "../dateUtils";

const ACTIVITY_META: Record<ActivityType, { emoji: string; color: string }> = {
  Gym: { emoji: "🏋️", color: "var(--series-1)" },
  Cardio: { emoji: "🏃", color: "var(--series-2)" },
  Walk: { emoji: "🚶", color: "var(--series-3)" },
  Other: { emoji: "🎮", color: "var(--series-4)" },
};

type SubTab = "log" | "progress" | "guide";

function BurnLog() {
  const [date, setDate] = useState(todayIso());
  const [entries, setEntries] = useState<ExerciseEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [openPanel, setOpenPanel] = useState<ActivityType | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(
    Object.fromEntries(ACTIVITY_TYPES.map((t) => [t, false]))
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.exercise(date);
      setEntries(res.entries);
      setTotal(res.totalCalories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load exercise log");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function removeEntry(id: number) {
    try {
      await api.deleteExercise(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    }
  }

  const byType = new Map<ActivityType, ExerciseEntry[]>();
  for (const entry of entries) {
    const list = byType.get(entry.activity_type) ?? [];
    list.push(entry);
    byType.set(entry.activity_type, list);
  }

  function toggleCollapse(type: string) {
    setCollapsed((c) => ({ ...c, [type]: !c[type] }));
  }

  return (
    <>
      <div className="date-nav">
        <button type="button" aria-label="Previous day" onClick={() => setDate((d) => shiftDate(d, -1))}>
          ‹
        </button>
        <span className="date-label">{formatDisplayDate(date)}</span>
        <button type="button" aria-label="Next day" onClick={() => setDate((d) => shiftDate(d, 1))}>
          ›
        </button>
      </div>

      <WeekStrip date={date} onPick={setDate} />

      <div className="summary-card">
        <div className="summary-headline">
          <span className="total-value">{Math.round(total)}</span>
          <span className="total-label">kcal burned</span>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Tracked separately — this never subtracts from your food calories.
        </p>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="category-list">
          {ACTIVITY_TYPES.map((type) => {
            const typeEntries = byType.get(type) ?? [];
            const subtotal = typeEntries.reduce((sum, e) => sum + e.calories, 0);
            const isCollapsed = !!collapsed[type];
            const meta = ACTIVITY_META[type];
            return (
              <div key={type} className="category-card" style={{ borderLeftColor: meta.color }}>
                <button type="button" className="category-header" onClick={() => toggleCollapse(type)}>
                  <span className={isCollapsed ? "chevron collapsed" : "chevron"}>▾</span>
                  <span className="category-icon">{meta.emoji}</span>
                  <span className="category-name">{type}</span>
                  <span className="category-subtotal">{Math.round(subtotal)} kcal</span>
                </button>

                {!isCollapsed && (
                  <>
                    {typeEntries.length > 0 && (
                      <ul className="entry-list">
                        {typeEntries.map((entry) => (
                          <li key={entry.id} className="entry-row">
                            <div className="entry-main">
                              <span className="entry-name">
                                {entry.note || type}
                              </span>
                              <span className="entry-cal">{Math.round(entry.calories)} kcal</span>
                              <button
                                type="button"
                                className="delete-btn"
                                aria-label={`Delete ${entry.note || type}`}
                                onClick={() => removeEntry(entry.id)}
                              >
                                ✕
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="category-actions">
                      <button
                        type="button"
                        className="add-btn"
                        onClick={() => setOpenPanel(openPanel === type ? null : type)}
                      >
                        {openPanel === type ? "Close" : "+ Add"}
                      </button>
                    </div>

                    {openPanel === type && (
                      <ActivityLogPanel
                        activityType={type}
                        date={date}
                        onAdded={() => {
                          setOpenPanel(null);
                          load();
                        }}
                        onClose={() => setOpenPanel(null)}
                      />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function Exercise() {
  const [subTab, setSubTab] = useState<SubTab>("log");

  return (
    <div className="log-screen">
      <div className="log-panel-tabs exercise-subtabs">
        <button type="button" className={subTab === "log" ? "tab active" : "tab"} onClick={() => setSubTab("log")}>
          Burn Log
        </button>
        <button
          type="button"
          className={subTab === "progress" ? "tab active" : "tab"}
          onClick={() => setSubTab("progress")}
        >
          Progress
        </button>
        <button type="button" className={subTab === "guide" ? "tab active" : "tab"} onClick={() => setSubTab("guide")}>
          Guide
        </button>
      </div>

      {subTab === "log" && <BurnLog />}
      {subTab === "progress" && <StrengthProgress />}
      {subTab === "guide" && <ExerciseGuide />}
    </div>
  );
}
