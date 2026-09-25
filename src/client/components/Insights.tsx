import { useEffect, useState } from "react";
import { api, type Insights as InsightsData } from "../api";
import WeekStrip from "./WeekStrip";
import { todayIso, shiftDate, formatDisplayDate } from "../dateUtils";

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function shiftDateByMonth(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1 + delta, 1);
  const daysInTarget = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const day = Math.min(d, daysInTarget);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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

type DayTotals = { calories: number; protein: number; carbs: number; fat: number; fiber: number };
const EMPTY_DAY: DayTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

function Meter({
  label,
  colorVar,
  value,
  goal,
  unit,
}: {
  label: string;
  colorVar: string;
  value: number;
  goal: number | null;
  unit: string;
}) {
  const scale = goal != null ? Math.max(goal, value) * 1.15 : value * 1.3 || 1;
  const pct = Math.min(100, (value / scale) * 100);
  const goalPct = goal != null ? Math.min(100, (goal / scale) * 100) : null;
  return (
    <div className="meter-row">
      <div className="meter-label">
        <span className="color-dot" style={{ background: `var(${colorVar})` }} />
        {label}
      </div>
      <div className="meter-track" style={{ ["--meter-color" as string]: `var(${colorVar})` }}>
        <div className="meter-fill" style={{ width: `${pct}%` }} />
        {goalPct != null && <div className="meter-goal-tick" style={{ left: `${goalPct}%` }} />}
      </div>
      <div className="meter-value muted">
        {round1(value)}
        {unit}
        {goal != null && <> / {Math.round(goal)}{unit}</>}
      </div>
    </div>
  );
}

export default function Insights() {
  return (
    <div className="log-screen">
      <Overview />
    </div>
  );
}

function Overview() {
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const month = selectedDate.slice(0, 7);
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .insights(month)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load insights"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  if (loading && !data) return <p className="muted">Loading…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!data) return null;

  const dayRow = data.days.find((d) => d.date === selectedDate) ?? null;
  const dayTotals: DayTotals = dayRow ?? EMPTY_DAY;

  const goalCalories = data.goals.calories;
  const calPct = goalCalories != null && goalCalories > 0 ? Math.min(100, Math.round((dayTotals.calories / goalCalories) * 100)) : null;

  const byDate = new Map(data.days.map((d) => [d.date, d]));
  const dayValues = Array.from({ length: data.daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const date = `${month}-${String(dayNum).padStart(2, "0")}`;
    return { dayNum, date, calories: byDate.get(date)?.calories ?? 0 };
  });

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
        <button type="button" aria-label="Previous day" onClick={() => setSelectedDate((d) => shiftDate(d, -1))}>
          ‹
        </button>
        <span className="date-label">{formatDisplayDate(selectedDate)}</span>
        <button
          type="button"
          aria-label="Next day"
          onClick={() => setSelectedDate((d) => shiftDate(d, 1))}
          disabled={selectedDate >= todayIso()}
        >
          ›
        </button>
      </div>

      <WeekStrip date={selectedDate} onPick={setSelectedDate} />

      <div className="day-summary-card">
        <div className="day-ring-wrap">
          <div
            className="day-ring"
            style={{ ["--pct" as string]: String(calPct ?? 0) }}
          >
            <div className="day-ring-inner">
              <span className="day-ring-value">{Math.round(dayTotals.calories)}</span>
              <span className="day-ring-label">
                kcal{goalCalories != null && <> / {Math.round(goalCalories)}</>}
              </span>
            </div>
          </div>
        </div>

        <div className="day-meters">
          <Meter label="Protein" colorVar="--series-1" value={dayTotals.protein} goal={data.goals.protein} unit="g" />
          <Meter label="Carbs" colorVar="--series-2" value={dayTotals.carbs} goal={data.goals.carbs} unit="g" />
          <Meter label="Fiber" colorVar="--series-3" value={dayTotals.fiber} goal={data.goals.fiber} unit="g" />
          <Meter label="Fat" colorVar="--series-4" value={dayTotals.fat} goal={data.goals.fat} unit="g" />
        </div>

        {!dayRow && (
          <p className="muted day-empty-note">
            {selectedDate === todayIso()
              ? "No food logged yet today."
              : `No food logged on ${formatDisplayDate(selectedDate)}.`}
          </p>
        )}
      </div>

      <div className="insights-section">
        <div className="insights-section-header">
          <h3>Monthly overview</h3>
          <div className="insights-month-nav">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setSelectedDate((d) => shiftDateByMonth(d, -1))}
            >
              ‹
            </button>
            <span>{formatMonth(month)}</span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setSelectedDate((d) => shiftDateByMonth(d, 1))}
            >
              ›
            </button>
          </div>
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
              className={d.date === selectedDate ? "bar-chart-bar selected" : "bar-chart-bar"}
              title={`${d.date}: ${Math.round(d.calories)} kcal`}
              onClick={() => setSelectedDate(d.date)}
              style={{ height: `${Math.max((d.calories / maxVal) * 100, d.calories > 0 ? 3 : 0)}%` }}
            />
          ))}
        </div>
        <p className="bar-chart-caption muted">Tap a bar to view that day above</p>

        <div className="macro-bars">
          <Meter label="Protein" colorVar="--series-1" value={data.averages.protein} goal={data.goals.protein} unit="g" />
          <Meter label="Carbs" colorVar="--series-2" value={data.averages.carbs} goal={data.goals.carbs} unit="g" />
          <Meter label="Fiber" colorVar="--series-3" value={data.averages.fiber} goal={data.goals.fiber} unit="g" />
          <Meter label="Fat" colorVar="--series-4" value={data.averages.fat} goal={data.goals.fat} unit="g" />
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
    </div>
  );
}
