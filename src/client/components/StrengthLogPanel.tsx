import { useState } from "react";
import { api } from "../api";
import { todayIso } from "../dateUtils";

export default function StrengthLogPanel({
  existingNames,
  onAdded,
  onClose,
}: {
  existingNames: string[];
  onAdded: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Exercise name is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.addStrengthLog({
        exercise_name: trimmed,
        weight_kg: weight ? Number(weight) : null,
        sets: sets ? Number(sets) : null,
        reps: reps ? Number(reps) : null,
        note: note.trim() || null,
        date,
      });
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="log-panel">
      <div className="log-panel-tabs">
        <span className="tab active">Log a session</span>
        <button type="button" className="panel-close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
      </div>
      <form className="custom-food-form" onSubmit={submit}>
        <div className="field-row">
          <input
            type="text"
            list="strength-exercise-names"
            placeholder="Exercise (e.g. Shoulder press)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
          <datalist id="strength-exercise-names">
            {existingNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>
        <div className="field-row macros">
          <input
            type="number"
            placeholder="Weight kg"
            min={0}
            step="any"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <input
            type="number"
            placeholder="Sets"
            min={0}
            step="1"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
          />
          <input
            type="number"
            placeholder="Reps"
            min={0}
            step="1"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
        </div>
        <div className="field-row">
          <input
            type="text"
            placeholder="Note (optional, e.g. 15-15 dumbbells)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="field-row">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayIso()} />
        </div>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
