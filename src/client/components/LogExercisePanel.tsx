import { useEffect, useState } from "react";
import { api, type Exercise } from "../api";

export default function LogExercisePanel({
  muscleGroup,
  date,
  onAdded,
  onClose,
}: {
  muscleGroup: string;
  date: string;
  onAdded: () => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"search" | "custom">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [customName, setCustomName] = useState("");
  const [customUnit, setCustomUnit] = useState("3 sets");
  const [customCalories, setCustomCalories] = useState("");

  useEffect(() => {
    if (mode !== "search" || selected) return;
    const handle = setTimeout(async () => {
      try {
        const res = await api.searchExercises(query, muscleGroup);
        setResults(res.exercises);
      } catch {
        // ignore transient search errors
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [query, mode, selected, muscleGroup]);

  async function confirmEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.addExerciseEntryFromCatalog(date, selected.id, qty);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setBusy(false);
    }
  }

  async function submitCustomExercise(e: React.FormEvent) {
    e.preventDefault();
    const calories = Number(customCalories);
    if (!customName.trim() || !customUnit.trim() || !Number.isFinite(calories)) {
      setError("Name, unit, and calories are required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const exercise = await api.addExerciseToCatalog({
        name: customName.trim(),
        muscle_group: muscleGroup,
        unit_label: customUnit.trim(),
        avg_calories: calories,
      });
      await api.addExerciseEntryFromCatalog(date, exercise.id, 1);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save custom exercise");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="log-panel">
      <div className="log-panel-tabs">
        <button
          type="button"
          className={mode === "search" ? "tab active" : "tab"}
          onClick={() => {
            setMode("search");
            setSelected(null);
            setError(null);
          }}
        >
          Search
        </button>
        <button
          type="button"
          className={mode === "custom" ? "tab active" : "tab"}
          onClick={() => {
            setMode("custom");
            setSelected(null);
            setError(null);
          }}
        >
          Custom exercise
        </button>
        <button type="button" className="panel-close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
      </div>

      {mode === "search" && !selected && (
        <div className="search-block">
          <input
            type="text"
            placeholder={`Search ${muscleGroup} exercises…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <ul className="food-results">
            {results.map((ex) => (
              <li key={ex.id}>
                <button type="button" onClick={() => setSelected(ex)}>
                  <span className="food-name">{ex.name}</span>
                  <span className="food-meta">
                    {ex.unit_label} · {Math.round(ex.avg_calories)} kcal
                  </span>
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="muted">No exercises found.</li>}
          </ul>
        </div>
      )}

      {mode === "search" && selected && (
        <form className="quantity-form" onSubmit={confirmEntry}>
          <p className="selected-food">
            {selected.name} <span className="muted">({selected.unit_label})</span>
          </p>
          <div className="quantity-row">
            <label>
              Sets / rounds
              <input
                type="number"
                min={0.01}
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                autoFocus
                required
              />
            </label>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Adding…" : "Add"}
            </button>
          </div>
          <button type="button" className="link-btn" onClick={() => setSelected(null)}>
            ‹ Back to search
          </button>
        </form>
      )}

      {mode === "custom" && (
        <form className="custom-food-form" onSubmit={submitCustomExercise}>
          <div className="field-row">
            <input
              type="text"
              placeholder="Name (e.g. Cable row)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              required
            />
          </div>
          <div className="field-row">
            <input
              type="text"
              placeholder="Unit (e.g. 3 sets)"
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="avg kcal"
              min={0}
              step="any"
              value={customCalories}
              onChange={(e) => setCustomCalories(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save & log"}
          </button>
        </form>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
