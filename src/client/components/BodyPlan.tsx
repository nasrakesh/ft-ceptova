import { useEffect, useState } from "react";
import { api, type ActivityLevel, type GoalType, type Plan, type Profile, type Sex } from "../api";

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sedentary (little/no exercise)" },
  { value: "light", label: "Light (1-3 days/week)" },
  { value: "moderate", label: "Moderate (3-5 days/week)" },
  { value: "active", label: "Active (6-7 days/week)" },
  { value: "very_active", label: "Very active (hard exercise daily)" },
];

const BMI_STATUS: Record<string, { label: string; color: string }> = {
  underweight: { label: "Underweight", color: "var(--status-warning)" },
  normal: { label: "Normal", color: "var(--status-good)" },
  overweight: { label: "Overweight", color: "var(--status-serious)" },
  obese: { label: "Obese", color: "var(--status-critical)" },
};

type FormState = {
  height_cm: string;
  current_weight_kg: string;
  target_weight_kg: string;
  age: string;
  sex: Sex | "";
  activity_level: ActivityLevel | "";
  goal_type: GoalType;
  target_weeks: string;
};

const EMPTY_FORM: FormState = {
  height_cm: "",
  current_weight_kg: "",
  target_weight_kg: "",
  age: "",
  sex: "",
  activity_level: "",
  goal_type: "maintain",
  target_weeks: "12",
};

export default function BodyPlan() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.profile().then((p) => {
      setForm({
        height_cm: p.height_cm?.toString() ?? "",
        current_weight_kg: p.current_weight_kg?.toString() ?? "",
        target_weight_kg: p.target_weight_kg?.toString() ?? "",
        age: p.age?.toString() ?? "",
        sex: p.sex ?? "",
        activity_level: p.activity_level ?? "",
        goal_type: p.goal_type ?? "maintain",
        target_weeks: p.target_weeks?.toString() ?? "12",
      });
      if (p.plan.bmi != null) setPlan(p.plan);
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setApplied(false);
    try {
      const payload: Omit<Profile, "plan"> = {
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        current_weight_kg: form.current_weight_kg ? Number(form.current_weight_kg) : null,
        target_weight_kg: form.target_weight_kg ? Number(form.target_weight_kg) : null,
        age: form.age ? Number(form.age) : null,
        sex: form.sex || null,
        activity_level: form.activity_level || null,
        goal_type: form.goal_type || null,
        target_weeks: form.target_weeks ? Number(form.target_weeks) : null,
      };
      const result = await api.saveProfile(payload);
      setPlan(result.plan.bmi != null ? result.plan : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setBusy(false);
    }
  }

  async function applyToGoals() {
    if (!plan) return;
    setApplying(true);
    setError(null);
    try {
      await api.saveGoals({
        calories: plan.recommendedCalories,
        protein: plan.recommendedProtein,
        carbs: plan.recommendedCarbs,
        fat: plan.recommendedFat,
        fiber: plan.recommendedFiber,
      });
      setApplied(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply goals");
    } finally {
      setApplying(false);
    }
  }

  const status = plan?.bmiCategory ? BMI_STATUS[plan.bmiCategory] : null;

  return (
    <div className="body-plan">
      <form className="profile-form" onSubmit={save}>
        <div className="field-row">
          <label>
            Height (cm)
            <input
              type="number"
              min={0}
              value={form.height_cm}
              onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value }))}
            />
          </label>
          <label>
            Age
            <input
              type="number"
              min={0}
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
            />
          </label>
        </div>
        <div className="field-row">
          <label>
            Current weight (kg)
            <input
              type="number"
              min={0}
              step="any"
              value={form.current_weight_kg}
              onChange={(e) => setForm((f) => ({ ...f, current_weight_kg: e.target.value }))}
            />
          </label>
          <label>
            Target weight (kg)
            <input
              type="number"
              min={0}
              step="any"
              value={form.target_weight_kg}
              onChange={(e) => setForm((f) => ({ ...f, target_weight_kg: e.target.value }))}
            />
          </label>
        </div>
        <label>
          Sex (for BMR calculation)
          <select
            value={form.sex}
            onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value as Sex }))}
          >
            <option value="">Select…</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </label>
        <label>
          Activity level
          <select
            value={form.activity_level}
            onChange={(e) => setForm((f) => ({ ...f, activity_level: e.target.value as ActivityLevel }))}
          >
            <option value="">Select…</option>
            {ACTIVITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <div className="field-row">
          <label>
            Goal
            <select
              value={form.goal_type}
              onChange={(e) => setForm((f) => ({ ...f, goal_type: e.target.value as GoalType }))}
            >
              <option value="lose">Lose weight</option>
              <option value="maintain">Maintain</option>
              <option value="gain">Gain weight / muscle</option>
            </select>
          </label>
          <label>
            Timeframe (weeks)
            <input
              type="number"
              min={1}
              value={form.target_weeks}
              onChange={(e) => setForm((f) => ({ ...f, target_weeks: e.target.value }))}
            />
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Calculating…" : "Calculate my plan"}
        </button>
      </form>

      {plan && status && (
        <div className="plan-result">
          <div className="bmi-badge">
            <span className="bmi-dot" style={{ background: status.color }} />
            <span className="bmi-value">BMI {plan.bmi}</span>
            <span className="bmi-label" style={{ color: status.color }}>
              {status.label}
            </span>
          </div>

          <div className="plan-stats">
            <div>
              <span className="plan-stat-label">BMR</span>
              <span className="plan-stat-value">{plan.bmr} kcal</span>
            </div>
            <div>
              <span className="plan-stat-label">Maintenance (TDEE)</span>
              <span className="plan-stat-value">{plan.tdee} kcal</span>
            </div>
          </div>

          <div className="plan-recommend">
            <p className="plan-headline">
              Recommended: <strong>{plan.recommendedCalories} kcal/day</strong>
            </p>
            <div className="macro-chips plan-macro-chips">
              <span className="chip chip-protein">P {plan.recommendedProtein}g</span>
              <span className="chip chip-carbs">C {plan.recommendedCarbs}g</span>
              <span className="chip chip-fiber">Fbr {plan.recommendedFiber}g</span>
              <span className="chip chip-fat">F {plan.recommendedFat}g</span>
            </div>
            {plan.weeklyRateKg != null && Math.abs(plan.weeklyRateKg) > 0.01 && (
              <p className="muted plan-note">
                Estimated pace: {plan.weeklyRateKg > 0 ? "+" : ""}
                {plan.weeklyRateKg} kg/week
                {plan.estimatedWeeksToGoal != null && <> · ~{plan.estimatedWeeksToGoal} weeks to reach your target</>}
              </p>
            )}
            {plan.calorieFloorApplied && (
              <p className="plan-note plan-note-warning">
                Capped at a safe minimum calorie floor — your goal may take longer than the timeframe you set.
              </p>
            )}
            <button type="button" className="btn-primary" onClick={applyToGoals} disabled={applying}>
              {applying ? "Applying…" : applied ? "Applied to goals ✓" : "Use as my daily goals"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
