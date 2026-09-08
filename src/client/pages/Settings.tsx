import { useEffect, useState } from "react";
import { api, type Category, type Goals } from "../api";
import CollapsibleSection from "../components/CollapsibleSection";
import BodyPlan from "../components/BodyPlan";
import Insights from "../components/Insights";
import { TargetIcon, UtensilsIcon, ScaleIcon, ChartIcon } from "../icons";

const GOAL_FIELDS: { key: keyof Goals; label: string; colorVar: string }[] = [
  { key: "calories", label: "Calories (kcal)", colorVar: "" },
  { key: "protein", label: "Protein (g)", colorVar: "--series-1" },
  { key: "carbs", label: "Carbs (g)", colorVar: "--series-2" },
  { key: "fiber", label: "Fiber (g)", colorVar: "--series-3" },
  { key: "fat", label: "Fat (g)", colorVar: "--series-4" },
];

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export default function Settings() {
  const [goals, setGoals] = useState<Record<keyof Goals, string>>({
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
  });
  const [goalView, setGoalView] = useState<"daily" | "monthly">("daily");
  const [goalsSaved, setGoalsSaved] = useState(false);
  const [goalsBusy, setGoalsBusy] = useState(false);
  const [goalsError, setGoalsError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [catError, setCatError] = useState<string | null>(null);

  useEffect(() => {
    api.goals().then((g) =>
      setGoals({
        calories: g.calories?.toString() ?? "",
        protein: g.protein?.toString() ?? "",
        carbs: g.carbs?.toString() ?? "",
        fat: g.fat?.toString() ?? "",
        fiber: g.fiber?.toString() ?? "",
      })
    );
    api.categories().then((res) => setCategories(res.categories));
  }, []);

  async function saveGoals(e: React.FormEvent) {
    e.preventDefault();
    setGoalsBusy(true);
    setGoalsError(null);
    setGoalsSaved(false);
    try {
      const payload: Goals = {
        calories: goals.calories ? Number(goals.calories) : null,
        protein: goals.protein ? Number(goals.protein) : null,
        carbs: goals.carbs ? Number(goals.carbs) : null,
        fat: goals.fat ? Number(goals.fat) : null,
        fiber: goals.fiber ? Number(goals.fiber) : null,
      };
      await api.saveGoals(payload);
      setGoalsSaved(true);
    } catch (err) {
      setGoalsError(err instanceof Error ? err.message : "Failed to save goals");
    } finally {
      setGoalsBusy(false);
    }
  }

  async function renameCategory(id: number, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCategories((cats) => cats.map((c) => (c.id === id ? { ...c, name: trimmed } : c)));
    try {
      await api.renameCategory(id, trimmed);
    } catch (err) {
      setCatError(err instanceof Error ? err.message : "Failed to rename category");
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const reordered = [...categories];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setCategories(reordered);
    try {
      await api.reorderCategories(reordered.map((c) => c.id));
    } catch (err) {
      setCatError(err instanceof Error ? err.message : "Failed to reorder categories");
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    setCatError(null);
    try {
      const created = await api.addCategory(name);
      setCategories((cats) => [...cats, created]);
      setNewCategoryName("");
    } catch (err) {
      setCatError(err instanceof Error ? err.message : "Failed to add category");
    }
  }

  async function deleteCategory(id: number) {
    setCatError(null);
    try {
      await api.deleteCategory(id);
      setCategories((cats) => cats.filter((c) => c.id !== id));
    } catch (err) {
      setCatError(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setConfirmDeleteId(null);
    }
  }

  const multiplier = goalView === "monthly" ? daysInMonth(new Date()) : 1;

  return (
    <div className="settings-screen">
      <CollapsibleSection title="Goals" icon={<TargetIcon size={18} />} accentColor="var(--series-1)">
        <div className="goal-view-toggle">
          <button
            type="button"
            className={goalView === "daily" ? "seg-btn active" : "seg-btn"}
            onClick={() => setGoalView("daily")}
          >
            Daily
          </button>
          <button
            type="button"
            className={goalView === "monthly" ? "seg-btn active" : "seg-btn"}
            onClick={() => setGoalView("monthly")}
          >
            Monthly
          </button>
        </div>

        {goalView === "daily" ? (
          <form className="goals-form" onSubmit={saveGoals}>
            {GOAL_FIELDS.map(({ key, label, colorVar }) => (
              <label key={key}>
                {colorVar && <span className="color-dot" style={{ background: `var(${colorVar})` }} />}
                {label}
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={goals[key]}
                  onChange={(e) => {
                    setGoals((g) => ({ ...g, [key]: e.target.value }));
                    setGoalsSaved(false);
                  }}
                />
              </label>
            ))}
            {goalsError && <p className="error">{goalsError}</p>}
            <button type="submit" className="btn-primary" disabled={goalsBusy}>
              {goalsBusy ? "Saving…" : goalsSaved ? "Saved ✓" : "Save goals"}
            </button>
          </form>
        ) : (
          <div className="monthly-goal-view">
            <p className="muted">This month has {multiplier} days — targets scaled accordingly:</p>
            {GOAL_FIELDS.map(({ key, label, colorVar }) => {
              const val = goals[key] ? Number(goals[key]) : null;
              return (
                <div key={key} className="goal-row">
                  <span className="goal-label">
                    {colorVar && <span className="color-dot" style={{ background: `var(${colorVar})` }} />}
                    {label.replace(/\s*\(.*\)/, "")}
                  </span>
                  <span className="goal-value">{val != null ? Math.round(val * multiplier).toLocaleString() : "—"}</span>
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Categories" icon={<UtensilsIcon size={18} />} accentColor="var(--muted)">
        {catError && <p className="error">{catError}</p>}
        <ul className="category-manage-list">
          {categories.map((category, index) => (
            <li key={category.id} className="category-manage-row">
              <div className="reorder-btns">
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={index === categories.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ▼
                </button>
              </div>
              <input
                type="text"
                value={category.name}
                onChange={(e) =>
                  setCategories((cats) =>
                    cats.map((c) => (c.id === category.id ? { ...c, name: e.target.value } : c))
                  )
                }
                onBlur={(e) => renameCategory(category.id, e.target.value)}
              />
              {confirmDeleteId === category.id ? (
                <span className="confirm-delete">
                  <span>Delete?</span>
                  <button type="button" className="danger-btn" onClick={() => deleteCategory(category.id)}>
                    Yes
                  </button>
                  <button type="button" className="link-btn" onClick={() => setConfirmDeleteId(null)}>
                    No
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="delete-btn"
                  aria-label={`Delete ${category.name}`}
                  onClick={() => setConfirmDeleteId(category.id)}
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
        <form className="add-category-form" onSubmit={addCategory}>
          <input
            type="text"
            placeholder="New category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            Add
          </button>
        </form>
      </CollapsibleSection>

      <CollapsibleSection title="Body & Weight Plan" icon={<ScaleIcon size={18} />} accentColor="var(--status-serious)" defaultOpen={false}>
        <BodyPlan />
      </CollapsibleSection>

      <CollapsibleSection title="Insights" icon={<ChartIcon size={18} />} accentColor="var(--series-1)" defaultOpen={false}>
        <Insights />
      </CollapsibleSection>
    </div>
  );
}
