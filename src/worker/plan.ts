export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type GoalType = "lose" | "maintain" | "gain";

export interface Profile {
  height_cm: number | null;
  current_weight_kg: number | null;
  target_weight_kg: number | null;
  age: number | null;
  sex: Sex | null;
  activity_level: ActivityLevel | null;
  goal_type: GoalType | null;
  target_weeks: number | null;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const KCAL_PER_KG_FAT = 7700;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function bmiOf(heightCm: number, weightKg: number): { bmi: number; category: string } {
  const h = heightCm / 100;
  const bmi = weightKg / (h * h);
  let category: string;
  if (bmi < 18.5) category = "underweight";
  else if (bmi < 25) category = "normal";
  else if (bmi < 30) category = "overweight";
  else category = "obese";
  return { bmi: round1(bmi), category };
}

export interface Plan {
  bmi: number | null;
  bmiCategory: string | null;
  bmr: number | null;
  tdee: number | null;
  recommendedCalories: number | null;
  recommendedProtein: number | null;
  recommendedCarbs: number | null;
  recommendedFat: number | null;
  recommendedFiber: number | null;
  weeklyRateKg: number | null;
  calorieFloorApplied: boolean;
  estimatedWeeksToGoal: number | null;
}

const EMPTY_PLAN: Plan = {
  bmi: null,
  bmiCategory: null,
  bmr: null,
  tdee: null,
  recommendedCalories: null,
  recommendedProtein: null,
  recommendedCarbs: null,
  recommendedFat: null,
  recommendedFiber: null,
  weeklyRateKg: null,
  calorieFloorApplied: false,
  estimatedWeeksToGoal: null,
};

export function computePlan(p: Profile): Plan {
  const { height_cm: height, current_weight_kg: weight, age, sex } = p;
  if (!height || !weight || !age || !sex) return EMPTY_PLAN;

  const { bmi, category: bmiCategory } = bmiOf(height, weight);

  const base = 10 * weight + 6.25 * height - 5 * age;
  const bmr = sex === "male" ? base + 5 : base - 161;

  const activity = p.activity_level ?? "sedentary";
  const tdee = bmr * ACTIVITY_MULTIPLIERS[activity];

  const targetWeight = p.target_weight_kg ?? weight;
  const targetWeeks = p.target_weeks && p.target_weeks > 0 ? p.target_weeks : 12;
  const weightDeltaKg = targetWeight - weight;
  const totalKcalDelta = weightDeltaKg * KCAL_PER_KG_FAT;
  const days = targetWeeks * 7;
  let dailyDelta = totalKcalDelta / days;
  dailyDelta = Math.max(-1000, Math.min(500, dailyDelta));

  const minCalories = sex === "male" ? 1500 : 1200;
  const uncappedCalories = tdee + dailyDelta;
  const recommendedCalories = Math.max(uncappedCalories, minCalories);
  const calorieFloorApplied = uncappedCalories < minCalories && weightDeltaKg < 0;

  const proteinG = weight * 1.8;
  const proteinKcal = proteinG * 4;
  const fatKcal = recommendedCalories * 0.25;
  const fatG = fatKcal / 9;
  const carbsKcal = Math.max(recommendedCalories - proteinKcal - fatKcal, 0);
  const carbsG = carbsKcal / 4;
  const fiberG = (recommendedCalories / 1000) * 14;

  // Achievable pace at the actual (possibly floored) recommended calories,
  // not the naive request — so the estimate stays honest when the floor bites.
  const actualDailyDelta = recommendedCalories - tdee;
  const weeklyRateKg = (actualDailyDelta * 7) / KCAL_PER_KG_FAT;
  const estimatedWeeksToGoal =
    Math.abs(weeklyRateKg) > 0.01 ? Math.abs(weightDeltaKg / weeklyRateKg) : null;

  return {
    bmi,
    bmiCategory,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    recommendedCalories: Math.round(recommendedCalories),
    recommendedProtein: round1(proteinG),
    recommendedCarbs: round1(carbsG),
    recommendedFat: round1(fatG),
    recommendedFiber: round1(fiberG),
    weeklyRateKg: round1(weeklyRateKg),
    calorieFloorApplied,
    estimatedWeeksToGoal: estimatedWeeksToGoal != null ? Math.round(estimatedWeeksToGoal) : null,
  };
}
