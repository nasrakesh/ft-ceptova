import { useEffect, useState } from "react";
import { api, type Category, type Entry, type ExerciseEntry, type Goals, type Totals } from "../api";
import LogFoodPanel from "../components/LogFoodPanel";
import { categoryIconFor } from "../icons";
import { computeCategoryBudgets, budgetStatus, BUDGET_STATUS_COLOR } from "../mealBudget";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function shiftDate(iso: string, deltaDays: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = todayIso();
  if (iso === today) return "Today";
  if (iso === shiftDate(today, -1)) return "Yesterday";
  if (iso === shiftDate(today, 1)) return "Tomorrow";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function weekDatesFor(iso: string): string[] {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + i);
    return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(
      day.getDate()
    ).padStart(2, "0")}`;
  });
}

function WeekStrip({ date, onPick }: { date: string; onPick: (iso: string) => void }) {
  const today = todayIso();
  const week = weekDatesFor(date);
  return (
    <div className="week-strip">
      {week.map((iso, i) => {
        const dayNum = Number(iso.split("-")[2]);
        const isSelected = iso === date;
        const isToday = iso === today;
        return (
          <button
            key={iso}
            type="button"
            className={isSelected ? "week-day active" : isToday ? "week-day is-today" : "week-day"}
            onClick={() => onPick(iso)}
          >
            <span className="week-day-letter">{WEEKDAY_LETTERS[i]}</span>
            <span className="week-day-num">{dayNum}</span>
          </button>
        );
      })}
    </div>
  );
}

const EMPTY_TOTALS: Totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function MacroChips({ totals }: { totals: Totals }) {
  return (
    <span className="macro-chips">
      <span className="chip chip-protein">P {round1(totals.protein)}g</span>
      <span className="chip chip-carbs">C {round1(totals.carbs)}g</span>
      <span className="chip chip-fiber">Fbr {round1(totals.fiber)}g</span>
      <span className="chip chip-fat">F {round1(totals.fat)}g</span>
    </span>
  );
}

function GoalRow({
  label,
  value,
  goal,
  unit,
  dotColor,
}: {
  label: string;
  value: number;
  goal: number | null;
  unit: string;
  dotColor: string;
}) {
  return (
    <div className="goal-row">
      <span className="goal-label">
        <span className="color-dot" style={{ background: dotColor }} />
        {label}
      </span>
      <span className="goal-value">
        {Math.round(value)}
        {unit}
        {goal != null && <span className="muted"> / {Math.round(goal)}{unit}</span>}
      </span>
    </div>
  );
}

function EntryRow({
  entry,
  onDeleted,
  onUpdated,
}: {
  entry: Entry;
  onDeleted: () => void;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [quantity, setQuantity] = useState(String(entry.quantity));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.updateEntryQuantity(entry.id, qty);
      setEditing(false);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update entry");
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <li className="entry-row entry-row-editing">
        <form className="entry-edit-form" onSubmit={save}>
          <span className="entry-name">{entry.custom_name}</span>
          <input
            type="number"
            min={0.01}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "…" : "Save"}
          </button>
          <button type="button" className="link-btn" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </li>
    );
  }

  return (
    <li className="entry-row">
      <div className="entry-main">
        <span className="entry-name">
          {entry.custom_name}
          {entry.quantity !== 1 && <span className="muted"> ×{entry.quantity}</span>}
        </span>
        <span className="entry-cal">{Math.round(entry.calories)} kcal</span>
        {entry.food_id != null && (
          <button type="button" className="edit-btn" aria-label={`Edit ${entry.custom_name}`} onClick={() => setEditing(true)}>
            ✎
          </button>
        )}
        <button
          type="button"
          className="delete-btn"
          aria-label={`Delete ${entry.custom_name}`}
          onClick={onDeleted}
        >
          ✕
        </button>
      </div>
      <MacroChips
        totals={{
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
          fiber: entry.fiber,
        }}
      />
    </li>
  );
}

function ExerciseCard({ date, onChange }: { date: string; onChange: () => void }) {
  const [entries, setEntries] = useState<ExerciseEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [adding, setAdding] = useState(false);
  const [calories, setCalories] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await api.exercise(date);
      setEntries(res.entries);
      setTotal(res.totalCalories);
    } catch {
      // non-critical, keep prior state
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cal = Number(calories);
    if (!Number.isFinite(cal) || cal <= 0) {
      setError("Calories must be greater than 0");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.addExercise(date, cal, note.trim() || undefined);
      setCalories("");
      setNote("");
      setAdding(false);
      await load();
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add exercise");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    try {
      await api.deleteExercise(id);
      await load();
      onChange();
    } catch {
      // ignore
    }
  }

  return (
    <div className="category-card exercise-card" style={{ borderLeftColor: "var(--status-good)" }}>
      <div className="category-header" style={{ cursor: "default" }}>
        <span className="category-icon" style={{ color: "var(--status-good)" }}>
          🔥
        </span>
        <span className="category-name">Exercise</span>
        <span className="category-subtotal">-{Math.round(total)} kcal</span>
      </div>

      {entries.length > 0 && (
        <ul className="entry-list">
          {entries.map((entry) => (
            <li key={entry.id} className="entry-row">
              <div className="entry-main">
                <span className="entry-name">{entry.note || "Workout"}</span>
                <span className="entry-cal">-{Math.round(entry.calories)} kcal</span>
                <button
                  type="button"
                  className="delete-btn"
                  aria-label="Delete exercise entry"
                  onClick={() => remove(entry.id)}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form className="add-form" onSubmit={submit}>
          <input
            type="text"
            placeholder="What did you do? (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <input
            type="number"
            placeholder="kcal burned"
            min={0}
            step="any"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "…" : "Add"}
          </button>
        </form>
      ) : (
        <div className="category-actions">
          <button type="button" className="add-btn" onClick={() => setAdding(true)}>
            + Log exercise
          </button>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default function DailyLog() {
  const [date, setDate] = useState(todayIso());
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [totals, setTotals] = useState<Totals>(EMPTY_TOTALS);
  const [goals, setGoals] = useState<Goals | null>(null);
  const [burned, setBurned] = useState(0);
  const [openPanel, setOpenPanel] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadStatic() {
    try {
      const [catRes, goalRes] = await Promise.all([api.categories(), api.goals()]);
      setCategories(catRes.categories);
      setGoals(goalRes);
      setCollapsed(Object.fromEntries(catRes.categories.map((c) => [c.id, true])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    }
  }

  async function loadEntries() {
    setLoading(true);
    setError(null);
    try {
      const [entriesRes, exerciseRes] = await Promise.all([api.entries(date), api.exercise(date)]);
      setEntries(entriesRes.entries);
      setTotals(entriesRes.totals);
      setBurned(exerciseRes.totalCalories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function removeEntry(id: number) {
    try {
      await api.deleteEntry(id);
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    }
  }

  const entriesByCategory = new Map<number, Entry[]>();
  for (const entry of entries) {
    const list = entriesByCategory.get(entry.category_id) ?? [];
    list.push(entry);
    entriesByCategory.set(entry.category_id, list);
  }

  const budgets = computeCategoryBudgets(categories, goals?.calories ?? null);
  const netCalories = totals.calories - burned;

  const allCollapsed = categories.length > 0 && categories.every((c) => collapsed[c.id]);

  function toggleCollapse(id: number) {
    setCollapsed((c) => ({ ...c, [id]: !c[id] }));
  }

  function setAllCollapsed(value: boolean) {
    const next: Record<number, boolean> = {};
    for (const c of categories) next[c.id] = value;
    setCollapsed(next);
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
          <span className="total-value">{Math.round(netCalories)}</span>
          <span className="total-label">
            kcal{goals?.calories != null && <> / {Math.round(goals.calories)}</>}
          </span>
        </div>
        {burned > 0 && (
          <p className="muted net-note">
            {Math.round(totals.calories)} eaten − {Math.round(burned)} burned
          </p>
        )}
        <div className="goal-grid">
          <GoalRow label="Protein" value={totals.protein} goal={goals?.protein ?? null} unit="g" dotColor="var(--series-1)" />
          <GoalRow label="Carbs" value={totals.carbs} goal={goals?.carbs ?? null} unit="g" dotColor="var(--series-2)" />
          <GoalRow label="Fiber" value={totals.fiber} goal={goals?.fiber ?? null} unit="g" dotColor="var(--series-3)" />
          <GoalRow label="Fat" value={totals.fat} goal={goals?.fat ?? null} unit="g" dotColor="var(--series-4)" />
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
            <ExerciseCard date={date} onChange={loadEntries} />
            {categories.map((category) => {
              const catEntries = entriesByCategory.get(category.id) ?? [];
              const subtotal = catEntries.reduce(
                (acc, e) => ({
                  calories: acc.calories + e.calories,
                  protein: acc.protein + e.protein,
                  carbs: acc.carbs + e.carbs,
                  fat: acc.fat + e.fat,
                  fiber: acc.fiber + e.fiber,
                }),
                { ...EMPTY_TOTALS }
              );
              const isCollapsed = !!collapsed[category.id];
              const { icon: CatIcon, color: catColor } = categoryIconFor(category.name);
              const budget = budgets.get(category.id) ?? 0;
              const status = budgets.size > 0 ? budgetStatus(subtotal.calories, budget) : null;
              return (
                <div key={category.id} className="category-card" style={{ borderLeftColor: catColor }}>
                  <button
                    type="button"
                    className="category-header"
                    onClick={() => toggleCollapse(category.id)}
                  >
                    <span className={isCollapsed ? "chevron collapsed" : "chevron"}>▾</span>
                    <span className="category-icon" style={{ color: catColor }}>
                      <CatIcon size={18} />
                    </span>
                    <span className="category-name">{category.name}</span>
                    {status && (
                      <span
                        className="budget-dot"
                        style={{ background: BUDGET_STATUS_COLOR[status] }}
                        title={`${Math.round(subtotal.calories)} of ${budget} kcal budget`}
                      />
                    )}
                    <span className="category-subtotal">
                      {Math.round(subtotal.calories)}
                      {budget > 0 && <span className="muted"> / {budget}</span>} kcal
                    </span>
                  </button>
                  {!isCollapsed && catEntries.length > 0 && (
                    <div className="category-subtotal-macros">
                      <MacroChips totals={subtotal} />
                    </div>
                  )}

                  {!isCollapsed && (
                    <>
                      {catEntries.length > 0 && (
                        <ul className="entry-list">
                          {catEntries.map((entry) => (
                            <EntryRow
                              key={entry.id}
                              entry={entry}
                              onDeleted={() => removeEntry(entry.id)}
                              onUpdated={loadEntries}
                            />
                          ))}
                        </ul>
                      )}

                      <div className="category-actions">
                        <button
                          type="button"
                          className="add-btn"
                          onClick={() => setOpenPanel(openPanel === category.id ? null : category.id)}
                        >
                          {openPanel === category.id ? "Close" : "+ Add"}
                        </button>
                      </div>

                      {openPanel === category.id && (
                        <LogFoodPanel
                          categoryId={category.id}
                          date={date}
                          onAdded={() => {
                            setOpenPanel(null);
                            loadEntries();
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
        </>
      )}
    </div>
  );
}
