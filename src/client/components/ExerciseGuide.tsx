import { useEffect, useState } from "react";
import { api, MUSCLE_GROUPS, type Exercise } from "../api";
import { MUSCLE_GROUP_META } from "../icons";
import MuscleIllustration from "./MuscleIllustration";

export default function ExerciseGuide() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(MUSCLE_GROUPS.map((g) => [g, true]))
  );
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);

  useEffect(() => {
    api
      .exerciseGuide()
      .then((res) => setExercises(res.exercises))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load guide"))
      .finally(() => setLoading(false));
  }, []);

  const byGroup = new Map<string, Exercise[]>();
  for (const ex of exercises) {
    const list = byGroup.get(ex.muscle_group) ?? [];
    list.push(ex);
    byGroup.set(ex.muscle_group, list);
  }

  function toggleGroup(group: string) {
    setCollapsedGroups((c) => ({ ...c, [group]: !c[group] }));
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="category-list">
      {MUSCLE_GROUPS.map((group) => {
        const groupExercises = byGroup.get(group) ?? [];
        const meta = MUSCLE_GROUP_META[group];
        const isCollapsed = !!collapsedGroups[group];
        return (
          <div key={group} className="category-card" style={{ borderLeftColor: meta.color }}>
            <button type="button" className="category-header" onClick={() => toggleGroup(group)}>
              <span className={isCollapsed ? "chevron collapsed" : "chevron"}>▾</span>
              <span className="category-icon">{meta.emoji}</span>
              <span className="category-name">{group}</span>
              <span className="category-subtotal">{groupExercises.length} exercises</span>
            </button>

            {!isCollapsed && (
              <ul className="guide-list">
                {groupExercises.map((ex) => {
                  const isOpen = expandedExercise === ex.id;
                  return (
                    <li key={ex.id} className="guide-item">
                      <button
                        type="button"
                        className="guide-item-header"
                        onClick={() => setExpandedExercise(isOpen ? null : ex.id)}
                      >
                        <span className={isOpen ? "chevron" : "chevron collapsed"}>▾</span>
                        <span className="entry-name">{ex.name}</span>
                        <span className="muted">{ex.unit_label}</span>
                      </button>
                      {isOpen && (
                        <div className="guide-item-body">
                          <MuscleIllustration group={group} color={meta.color} />
                          <p className="guide-instructions">
                            {ex.instructions || "No instructions added yet."}
                          </p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
