import { useState } from "react";
import { api, type ActivityType } from "../api";

export default function ActivityLogPanel({
  activityType,
  date,
  onAdded,
  onClose,
}: {
  activityType: ActivityType;
  date: string;
  onAdded: () => void;
  onClose: () => void;
}) {
  const [calories, setCalories] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      await api.addExerciseEntry(date, activityType, cal, note.trim() || undefined);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="log-panel">
      <div className="log-panel-tabs">
        <span className="tab active">Log {activityType} calories</span>
        <button type="button" className="panel-close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
      </div>
      <form className="custom-food-form" onSubmit={submit}>
        <div className="field-row">
          <input
            type="number"
            placeholder="kcal burned"
            min={0}
            step="any"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div className="field-row">
          <input
            type="text"
            placeholder="Note (optional, e.g. 30 min run)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Adding…" : "Add"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
