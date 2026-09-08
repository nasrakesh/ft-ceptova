import { useEffect, useState } from "react";
import { api, type Food } from "../api";

export default function LogFoodPanel({
  categoryId,
  date,
  onAdded,
  onClose,
}: {
  categoryId: number;
  date: string;
  onAdded: () => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"search" | "custom">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [selected, setSelected] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [customName, setCustomName] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [customCalories, setCustomCalories] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFat, setCustomFat] = useState("");
  const [customFiber, setCustomFiber] = useState("");

  useEffect(() => {
    if (mode !== "search" || selected) return;
    const handle = setTimeout(async () => {
      try {
        const res = await api.searchFoods(query);
        setResults(res.foods);
      } catch {
        // ignore transient search errors
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [query, mode, selected]);

  async function confirmFoodEntry(e: React.FormEvent) {
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
      await api.addEntryFromFood(date, categoryId, selected.id, qty);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setBusy(false);
    }
  }

  async function submitCustomFood(e: React.FormEvent) {
    e.preventDefault();
    const calories = Number(customCalories);
    if (!customName.trim() || !customUnit.trim() || !Number.isFinite(calories)) {
      setError("Name, unit, and calories are required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const food = await api.addFood({
        name: customName.trim(),
        unit_label: customUnit.trim(),
        calories,
        protein: customProtein ? Number(customProtein) : 0,
        carbs: customCarbs ? Number(customCarbs) : 0,
        fat: customFat ? Number(customFat) : 0,
        fiber: customFiber ? Number(customFiber) : 0,
      });
      await api.addEntryFromFood(date, categoryId, food.id, 1);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save custom food");
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
          Custom food
        </button>
        <button type="button" className="panel-close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
      </div>

      {mode === "search" && !selected && (
        <div className="search-block">
          <input
            type="text"
            placeholder="Search foods…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <ul className="food-results">
            {results.map((food) => (
              <li key={food.id}>
                <button type="button" onClick={() => setSelected(food)}>
                  <span className="food-name">{food.name}</span>
                  <span className="food-meta">
                    {food.unit_label} · {Math.round(food.calories)} kcal
                  </span>
                </button>
              </li>
            ))}
            {query && results.length === 0 && <li className="muted">No foods found.</li>}
          </ul>
        </div>
      )}

      {mode === "search" && selected && (
        <form className="quantity-form" onSubmit={confirmFoodEntry}>
          <p className="selected-food">
            {selected.name} <span className="muted">({selected.unit_label})</span>
          </p>
          <div className="quantity-row">
            <label>
              Quantity
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
        <form className="custom-food-form" onSubmit={submitCustomFood}>
          <div className="field-row">
            <input
              type="text"
              placeholder="Name (e.g. Whey — Chocolate)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              required
            />
          </div>
          <div className="field-row">
            <input
              type="text"
              placeholder="Unit (e.g. 1 scoop)"
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="kcal"
              min={0}
              step="any"
              value={customCalories}
              onChange={(e) => setCustomCalories(e.target.value)}
              required
            />
          </div>
          <div className="field-row macros">
            <input
              type="number"
              placeholder="Protein g"
              min={0}
              step="any"
              value={customProtein}
              onChange={(e) => setCustomProtein(e.target.value)}
            />
            <input
              type="number"
              placeholder="Carbs g"
              min={0}
              step="any"
              value={customCarbs}
              onChange={(e) => setCustomCarbs(e.target.value)}
            />
            <input
              type="number"
              placeholder="Fat g"
              min={0}
              step="any"
              value={customFat}
              onChange={(e) => setCustomFat(e.target.value)}
            />
            <input
              type="number"
              placeholder="Fiber g"
              min={0}
              step="any"
              value={customFiber}
              onChange={(e) => setCustomFiber(e.target.value)}
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
