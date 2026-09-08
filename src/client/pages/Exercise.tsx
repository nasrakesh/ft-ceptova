import { useEffect, useState } from "react";
import { api, MUSCLE_GROUPS, type ExerciseEntry } from "../api";
import LogExercisePanel from "../components/LogExercisePanel";
import WeekStrip from "../components/WeekStrip";
import { MUSCLE_GROUP_META } from "../icons";
import { todayIso, shiftDate, formatDisplayDate } from "../dateUtils";

export default function Exercise() {
  const [date, setDate] = useState(todayIso());
  const [entries, setEntries] = useState<ExerciseEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(
    Object.fromEntries(MUSCLE_GROUPS.map((g) => [g, true]))
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

  const entriesByGroup = new Map<string, ExerciseEntry[]>();
  for (const entry of entries) {
    const group = entry.muscle_group ?? "Other";
    const list = entriesByGroup.get(group) ?? [];
    list.push(entry);
    entriesByGroup.set(group, list);
  }
  const otherEntries = entriesByGroup.get("Other") ?? [];

  const allCollapsed = MUSCLE_GROUPS.every((g) => collapsed[g]);

  function toggleCollapse(group: string) {
    setCollapsed((c) => ({ ...c, [group]: !c[group] }));
  }

  function setAllCollapsed(value: boolean) {
    setCollapsed(Object.fromEntries(MUSCLE_GROUPS.map((g) => [g, value])));
  }

  return (
    <div className="log-screen">
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
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          <div className="collapse-toolbar">
            <button type="button" className="link-btn" onClick={() => setAllCollapsed(!allCollapsed)}>
              {allCollapsed ? "Expand all" : "Collapse all"}
            </button>
          </div>
          <div className="category-list">
            {MUSCLE_GROUPS.map((group) => {
              const groupEntries = entriesByGroup.get(group) ?? [];
              const subtotal = groupEntries.reduce((sum, e) => sum + e.calories, 0);
              const isCollapsed = !!collapsed[group];
              const meta = MUSCLE_GROUP_META[group];
              return (
                <div key={group} className="category-card" style={{ borderLeftColor: meta.color }}>
                  <button
                    type="button"
                    className="category-header"
                    onClick={() => toggleCollapse(group)}
                  >
                    <span className={isCollapsed ? "chevron collapsed" : "chevron"}>▾</span>
                    <span className="category-icon">{meta.emoji}</span>
                    <span className="category-name">{group}</span>
                    <span className="category-subtotal">{Math.round(subtotal)} kcal</span>
                  </button>

                  {!isCollapsed && (
                    <>
                      {groupEntries.length > 0 && (
                        <ul className="entry-list">
                          {groupEntries.map((entry) => (
                            <li key={entry.id} className="entry-row">
                              <div className="entry-main">
                                <span className="entry-name">
                                  {entry.note || "Workout"}
                                  {entry.quantity !== 1 && <span className="muted"> ×{entry.quantity}</span>}
                                </span>
                                <span className="entry-cal">{Math.round(entry.calories)} kcal</span>
                                <button
                                  type="button"
                                  className="delete-btn"
                                  aria-label={`Delete ${entry.note}`}
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
                          onClick={() => setOpenPanel(openPanel === group ? null : group)}
                        >
                          {openPanel === group ? "Close" : "+ Add"}
                        </button>
                      </div>

                      {openPanel === group && (
                        <LogExercisePanel
                          muscleGroup={group}
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

            {otherEntries.length > 0 && (
              <div className="category-card" style={{ borderLeftColor: "var(--muted)" }}>
                <div className="category-header" style={{ cursor: "default" }}>
                  <span className="category-icon">📝</span>
                  <span className="category-name">Other</span>
                  <span className="category-subtotal">
                    {Math.round(otherEntries.reduce((sum, e) => sum + e.calories, 0))} kcal
                  </span>
                </div>
                <ul className="entry-list">
                  {otherEntries.map((entry) => (
                    <li key={entry.id} className="entry-row">
                      <div className="entry-main">
                        <span className="entry-name">{entry.note || "Workout"}</span>
                        <span className="entry-cal">{Math.round(entry.calories)} kcal</span>
                        <button
                          type="button"
                          className="delete-btn"
                          aria-label={`Delete ${entry.note}`}
                          onClick={() => removeEntry(entry.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
