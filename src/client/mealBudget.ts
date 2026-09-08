import type { Category } from "./api";

function weightFor(name: string): number {
  if (/pre.?workout/i.test(name)) return 0.05;
  if (/post.?workout/i.test(name)) return 0.1;
  if (/breakfast/i.test(name)) return 0.2;
  if (/evening.?snack/i.test(name)) return 0.1;
  if (/mid.?afternoon/i.test(name) || /snack/i.test(name)) return 0.1;
  if (/lunch/i.test(name)) return 0.25;
  if (/dinner/i.test(name)) return 0.2;
  return -1;
}

export function computeCategoryBudgets(
  categories: Category[],
  dailyGoalCalories: number | null
): Map<number, number> {
  const budgets = new Map<number, number>();
  if (!dailyGoalCalories || categories.length === 0) return budgets;

  const weights = categories.map((c) => weightFor(c.name));
  const matchedTotal = weights.reduce((sum, w) => sum + (w > 0 ? w : 0), 0);
  const unmatchedCount = weights.filter((w) => w < 0).length;
  const remaining = Math.max(1 - matchedTotal, 0);
  const fallbackWeight = unmatchedCount > 0 ? remaining / unmatchedCount : 0;

  categories.forEach((cat, i) => {
    const w = weights[i] > 0 ? weights[i] : fallbackWeight;
    budgets.set(cat.id, Math.round(dailyGoalCalories * w));
  });

  return budgets;
}

export type BudgetStatus = "good" | "warning" | "critical";

export function budgetStatus(actual: number, budget: number): BudgetStatus {
  if (budget <= 0) return "good";
  const ratio = actual / budget;
  if (ratio <= 1.1) return "good";
  if (ratio <= 1.4) return "warning";
  return "critical";
}

export const BUDGET_STATUS_COLOR: Record<BudgetStatus, string> = {
  good: "var(--status-good)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
};
