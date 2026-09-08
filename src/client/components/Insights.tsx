import { useEffect, useState } from "react";
import { api, type Insights as InsightsData } from "../api";

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

const BMI_STATUS: Record<string, { label: string; color: string }> = {
  underweight: { label: "Underweight", color: "var(--status-warning)" },
  normal: { label: "Normal", color: "var(--status-good)" },
  overweight: { label: "Overweight", color: "var(--status-serious)" },
  obese: { label: "Obese", color: "var(--status-critical)" },
};

function MacroBar({
  label,
  colorVar,
  avg,
  goal,
  unit,
}: {
  label: string;
  colorVar: string;
  avg: number;
  goal: number | null;
  unit: string;
}) {
  const scale = goal != null ? Math.max(goal, avg) * 1.1 : avg * 1.2 || 1;
  const pct = Math.min(100, (avg / scale) * 100);
  const goalPct = goal != null ? Math.min(100, (goal / scale) * 100) : null;
  return (
    <div className="macro-bar-row">
      <div className="macro-bar-label">
        <span className="color-dot" style={{ background: `var(${colorVar})` }} />
        {label}
      </div>
      <div className="macro-bar-track">
        <div className="macro-bar-fill" style={{ width: `${pct}%`, background: `var(${colorVar})` }} />
        {goalPct != null && <div className="macro-bar-goal-tick" style={{ left: `${goalPct}%` }} />}
      </div>
      <div className="macro-bar-value muted">
        {round1(avg)}
        {unit}
        {goal != null && <> / {Math.round(goal)}{unit}</>}
      </div>
    </div>
  );
}

export default function Insights() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<InsightsData | null>(null);
  const [selected, setSelected] = useState<{ date: string; calories: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelected(null);
    api
      .insights(month)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load insights"))
      .finally(() => setLoading(false));
  }, [month]);

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!data) return null;

  const byDate = new Map(data.days.map((d) => [d.date, d]));
  const dayValues = Array.from({ length: data.daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const date = `${month}-${String(dayNum).padStart(2, "0")}`;
    return { dayNum, date, calories: byDate.get(date)?.calories ?? 0 };
  });

  const goalCalories = data.goals.calories;
  const maxVal = Math.max(goalCalories ?? 0, ...dayValues.map((d) => d.calories), 1) * 1.1;
  const goalLinePct = goalCalories != null ? Math.min(100, (goalCalories / maxVal) * 100) : null;

  const status = data.plan.bmiCategory ? BMI_STATUS[data.plan.bmiCategory] : null;

  const tips: string[] = [];
  if (goalCalories != null && data.daysLogged > 0) {
    if (data.averages.calories > goalCalories * 1.1) {
      tips.push(
        `Averaging ${Math.round(data.averages.calories)} kcal/day, above your ${goalCalories} kcal goal — consider lighter portions or lower-calorie swaps.`
      );
    } else if (data.averages.calories < goalCalories * 0.9) {
      tips.push(
        `Averaging ${Math.round(data.averages.calories)} kcal/day, under your ${goalCalories} kcal goal — make sure you're eating enough.`
      );
    } else {
      tips.push(`Right on track — averaging ${Math.round(data.averages.calories)} kcal/day against your ${goalCalories} kcal goal.`);
    }
  }
  if (data.goals.protein != null && data.daysLogged > 0 && data.averages.protein < data.goals.protein * 0.9) {
    tips.push(
      `Protein is running low — averaging ${round1(data.averages.protein)}g vs a ${data.goals.protein}g goal. Try adding an extra egg, paneer, or a scoop of whey.`
    );
  }
  if (status) {
    if (data.plan.bmiCategory === "normal") {
      tips.push(`Your BMI (${data.plan.bmi}) is in the healthy range — keep it up!`);
    } else if (data.plan.bmiCategory === "underweight") {
      tips.push(`Your BMI (${data.plan.bmi}) suggests underweight — a modest calorie surplus can help you reach a healthier range.`);
    } else {
      tips.push(`Your BMI (${data.plan.bmi}) suggests ${status.label.toLowerCase()} — a steady calorie deficit can help bring it down.`);
    }
  }

  return (
    <div className="insights">
      <div className="date-nav">
        <button type="button" aria-label="Previous month" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
          ‹
        </button>
        <span className="date-label">{formatMonth(month)}</span>
        <button type="button" aria-label="Next month" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
          ›
        </button>
      </div>

      <div className="insights-stat-row">
        <div className="insights-stat">
          <span className="insights-stat-value">{data.daysLogged}</span>
          <span className="insights-stat-label">/ {data.daysInMonth} days logged</span>
        </div>
        <div className="insights-stat">
          <span className="insights-stat-value">{Math.round(data.averages.calories)}</span>
          <span className="insights-stat-label">avg kcal/day</span>
        </div>
      </div>

      <div className="bar-chart-legend">
        <span><span className="legend-swatch legend-swatch-bar" /> Calories</span>
        {goalLinePct != null && <span><span className="legend-swatch legend-swatch-line" /> Goal</span>}
      </div>

      <div className="bar-chart">
        {goalLinePct != null && (
          <div className="bar-chart-goal-line" style={{ bottom: `${goalLinePct}%` }} />
        )}
        {dayValues.map((d) => (
          <button
            key={d.date}
            type="button"
            className="bar-chart-bar"
            title={`${d.date}: ${Math.round(d.calories)} kcal`}
            onClick={() => setSelected({ date: d.date, calories: d.calories })}
            style={{ height: `${Math.max((d.calories / maxVal) * 100, d.calories > 0 ? 3 : 0)}%` }}
          />
        ))}
      </div>
      <p className="bar-chart-caption muted">
        {selected
          ? `${selected.date}: ${Math.round(selected.calories)} kcal`
          : "Tap a bar to see that day's total"}
      </p>

      <div className="macro-bars">
        <MacroBar label="Protein" colorVar="--series-1" avg={data.averages.protein} goal={data.goals.protein} unit="g" />
        <MacroBar label="Carbs" colorVar="--series-2" avg={data.averages.carbs} goal={data.goals.carbs} unit="g" />
        <MacroBar label="Fiber" colorVar="--series-3" avg={data.averages.fiber} goal={data.goals.fiber} unit="g" />
        <MacroBar label="Fat" colorVar="--series-4" avg={data.averages.fat} goal={data.goals.fat} unit="g" />
      </div>

      {status && (
        <div className="bmi-badge">
          <span className="bmi-dot" style={{ background: status.color }} />
          <span className="bmi-value">BMI {data.plan.bmi}</span>
          <span className="bmi-label" style={{ color: status.color }}>
            {status.label}
          </span>
        </div>
      )}

      {tips.length > 0 && (
        <ul className="insight-tips">
          {tips.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
