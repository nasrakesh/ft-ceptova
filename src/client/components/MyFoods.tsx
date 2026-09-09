import { useEffect, useState } from "react";
import { api, type Food } from "../api";

type EditState = {
  name: string;
  unit_label: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
};

function toEditState(food: Food): EditState {
  return {
    name: food.name,
    unit_label: food.unit_label,
    calories: String(food.calories),
    protein: String(food.protein),
    carbs: String(food.carbs),
    fat: String(food.fat),
    fiber: String(food.fiber),
  };
}

export default function MyFoods() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.myFoods();
      setFoods(res.foods);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your foods");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(food: Food) {
    setEditingId(food.id);
    setEdit(toEditState(food));
    setError(null);
  }

  async function saveEdit(id: number) {
    if (!edit) return;
    const calories = Number(edit.calories);
    if (!edit.name.trim() || !edit.unit_label.trim() || !Number.isFinite(calories)) {
      setError("Name, unit, and calories are required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await api.updateFood(id, {
        name: edit.name.trim(),
        unit_label: edit.unit_label.trim(),
        calories,
        protein: edit.protein ? Number(edit.protein) : 0,
        carbs: edit.carbs ? Number(edit.carbs) : 0,
        fat: edit.fat ? Number(edit.fat) : 0,
        fiber: edit.fiber ? Number(edit.fiber) : 0,
      });
      setFoods((fs) => fs.map((f) => (f.id === id ? updated : f)));
      setEditingId(null);
      setEdit(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setBusy(false);
    }
  }

  async function deleteFood(id: number) {
    setError(null);
    try {
      await api.deleteFood(id);
      setFoods((fs) => fs.filter((f) => f.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete food");
    } finally {
      setConfirmDeleteId(null);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <div>
      {error && <p className="error">{error}</p>}
      {foods.length === 0 && <p className="muted">You haven't added any custom foods yet.</p>}
      <ul className="category-manage-list">
        {foods.map((food) => (
          <li key={food.id} className="food-manage-row">
            {editingId === food.id && edit ? (
              <>
                <div className="field-row">
                  <input
                    type="text"
                    value={edit.name}
                    onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                    placeholder="Name"
                  />
                </div>
                <div className="field-row">
                  <input
                    type="text"
                    value={edit.unit_label}
                    onChange={(e) => setEdit({ ...edit, unit_label: e.target.value })}
                    placeholder="Unit"
                  />
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={edit.calories}
                    onChange={(e) => setEdit({ ...edit, calories: e.target.value })}
                    placeholder="kcal"
                  />
                </div>
                <div className="field-row macros">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={edit.protein}
                    onChange={(e) => setEdit({ ...edit, protein: e.target.value })}
                    placeholder="Protein g"
                  />
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={edit.carbs}
                    onChange={(e) => setEdit({ ...edit, carbs: e.target.value })}
                    placeholder="Carbs g"
                  />
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={edit.fat}
                    onChange={(e) => setEdit({ ...edit, fat: e.target.value })}
                    placeholder="Fat g"
                  />
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={edit.fiber}
                    onChange={(e) => setEdit({ ...edit, fiber: e.target.value })}
                    placeholder="Fiber g"
                  />
                </div>
                <div className="category-actions" style={{ justifyContent: "flex-start", gap: 8 }}>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busy}
                    onClick={() => saveEdit(food.id)}
                  >
                    {busy ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => {
                      setEditingId(null);
                      setEdit(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="food-manage-row-header">
                <span className="food-name">{food.name}</span>
                <span className="muted">
                  {food.unit_label} · {Math.round(food.calories)} kcal
                </span>
                <button type="button" className="link-btn" onClick={() => startEdit(food)}>
                  Edit
                </button>
                {confirmDeleteId === food.id ? (
                  <span className="confirm-delete">
                    <span>Delete?</span>
                    <button type="button" className="danger-btn" onClick={() => deleteFood(food.id)}>
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
                    aria-label={`Delete ${food.name}`}
                    onClick={() => setConfirmDeleteId(food.id)}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
