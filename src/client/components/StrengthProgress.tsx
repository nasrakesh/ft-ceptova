import { useEffect, useState } from "react";
import { api, type StrengthLog } from "../api";
import StrengthLogPanel from "./StrengthLogPanel";
import { formatDisplayDate } from "../dateUtils";

function trendArrow(current: number | null, previous: number | null): string | null {
  if (current == null || previous == null) return null;
  if (current > previous) return "▲";
  if (current < previous) return "▼";
  return "–";
}

export default function StrengthProgress() {
  const [entries, setEntries] = useState<StrengthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.strengthLogs();
      setEntries(res.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load progress");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function removeEntry(id: number) {
    try {
      await api.deleteStrengthLog(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    }
  }

  const byExercise = new Map<string, StrengthLog[]>();
  for (const e of entries) {
    const list = byExercise.get(e.exercise_name) ?? [];
    list.push(e);
    byExercise.set(e.exercise_name, list);
  }
  const exerciseNames = [...byExercise.keys()].sort((a, b) => a.localeCompare(b));

  function toggle(name: string) {
    setCollapsed((c) => ({ ...c, [name]: !c[name] }));
  }

  return (
    <div className="category-list">
      <p className="muted" style={{ padding: "0 4px" }}>
        Log a session whenever you train a lift — every week or two is plenty. This tracks
        progress over time, not a daily log.
      </p>

      <div className="category-actions" style={{ paddingTop: 0 }}>
        <button type="button" className="add-btn" onClick={() => setPanelOpen((o) => !o)}>
          {panelOpen ? "Close" : "+ Log a session"}
        </button>
      </div>
      {panelOpen && (
        <StrengthLogPanel
          existingNames={exerciseNames}
          onAdded={() => {
            setPanelOpen(false);
            load();
          }}
          onClose={() => setPanelOpen(false)}
        />
      )}

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : exerciseNames.length === 0 ? (
        <p className="muted">No sessions logged yet.</p>
      ) : (
        exerciseNames.map((name) => {
          const sessions = [...(byExercise.get(name) ?? [])].sort((a, b) =>
            b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)
          );
          const isCollapsed = !!collapsed[name];
          const latest = sessions[0];
          return (
            <div key={name} className="category-card">
              <button type="button" className="category-header" onClick={() => toggle(name)}>
                <span className={isCollapsed ? "chevron collapsed" : "chevron"}>▾</span>
                <span className="category-name">{name}</span>
                <span className="category-subtotal">
                  {latest.weight_kg != null ? `${latest.weight_kg} kg` : latest.note || "—"}
                </span>
              </button>
              {!isCollapsed && (
                <ul className="entry-list">
                  {sessions.map((s, i) => {
                    const prev = sessions[i + 1];
                    const arrow = trendArrow(s.weight_kg, prev?.weight_kg ?? null);
                    return (
                      <li key={s.id} className="entry-row">
                        <div className="entry-main">
                          <span className="entry-name">
                            {formatDisplayDate(s.date)}
                            {s.weight_kg != null && (
                              <span className="muted">
                                {" "}
                                · {s.weight_kg} kg
                                {(s.sets || s.reps) &&
                                  ` × ${s.sets ?? "?"}${s.reps ? `×${s.reps}` : ""}`}
                              </span>
                            )}
                            {s.note && <span className="muted"> · {s.note}</span>}
                            {arrow && (
                              <span
                                className={
                                  arrow === "▲" ? "trend-up" : arrow === "▼" ? "trend-down" : "muted"
                                }
                              >
                                {" "}
                                {arrow}
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            className="delete-btn"
                            aria-label={`Delete ${name} entry`}
                            onClick={() => removeEntry(s.id)}
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
