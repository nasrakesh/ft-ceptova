async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export interface User {
  id: number;
  email: string;
  name: string | null;
}

export interface Category {
  id: number;
  name: string;
  sort_order: number;
}

export interface Food {
  id: number;
  name: string;
  unit_label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  is_global: number;
}

export interface NewFood {
  name: string;
  unit_label: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

export interface Entry {
  id: number;
  category_id: number;
  food_id: number | null;
  custom_name: string;
  date: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  created_at: string;
}

export interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface EntriesResponse {
  date: string;
  entries: Entry[];
  totals: Totals;
}

export type Goals = {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
};

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type GoalType = "lose" | "maintain" | "gain";

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

export interface Profile {
  height_cm: number | null;
  current_weight_kg: number | null;
  target_weight_kg: number | null;
  age: number | null;
  sex: Sex | null;
  activity_level: ActivityLevel | null;
  goal_type: GoalType | null;
  target_weeks: number | null;
  plan: Plan;
}

export interface InsightsDay {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export const MUSCLE_GROUPS = [
  "Back",
  "Chest",
  "Shoulder",
  "Triceps",
  "Biceps",
  "Legs",
  "Abdomen",
  "Cardio",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  unit_label: string;
  avg_calories: number;
  is_global: number;
}

export interface NewExercise {
  name: string;
  muscle_group: string;
  unit_label: string;
  avg_calories: number;
}

export interface ExerciseEntry {
  id: number;
  exercise_id: number | null;
  muscle_group: string | null;
  quantity: number;
  calories: number;
  note: string | null;
  created_at: string;
}

export interface ExerciseResponse {
  date: string;
  entries: ExerciseEntry[];
  totalCalories: number;
}

export interface Insights {
  month: string;
  daysInMonth: number;
  days: InsightsDay[];
  daysLogged: number;
  totals: Totals;
  averages: Totals;
  goals: Goals;
  plan: Plan;
}

export const api = {
  me: () => request<User>("/api/auth/me"),
  signup: (email: string, password: string) =>
    request<User>("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    request<User>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  updateAccountName: (name: string | null) =>
    request<User>("/api/account", { method: "PUT", body: JSON.stringify({ name }) }),

  categories: () => request<{ categories: Category[] }>("/api/categories"),
  addCategory: (name: string) =>
    request<Category>("/api/categories", { method: "POST", body: JSON.stringify({ name }) }),
  renameCategory: (id: number, name: string) =>
    request<{ ok: true }>(`/api/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),
  reorderCategories: (order: number[]) =>
    request<{ ok: true }>("/api/categories/reorder", {
      method: "PUT",
      body: JSON.stringify({ order }),
    }),
  deleteCategory: (id: number) =>
    request<{ ok: true }>(`/api/categories/${id}`, { method: "DELETE" }),

  searchFoods: (q: string) =>
    request<{ foods: Food[] }>(`/api/foods?q=${encodeURIComponent(q)}`),
  addFood: (food: NewFood) =>
    request<Food>("/api/foods", { method: "POST", body: JSON.stringify(food) }),

  entries: (date: string) => request<EntriesResponse>(`/api/entries?date=${date}`),
  addEntryFromFood: (date: string, category_id: number, food_id: number, quantity: number) =>
    request<Entry>("/api/entries", {
      method: "POST",
      body: JSON.stringify({ date, category_id, food_id, quantity }),
    }),
  addCustomEntry: (date: string, category_id: number, custom_name: string, calories: number) =>
    request<Entry>("/api/entries", {
      method: "POST",
      body: JSON.stringify({ date, category_id, custom_name, calories }),
    }),
  deleteEntry: (id: number) => request<{ ok: true }>(`/api/entries/${id}`, { method: "DELETE" }),
  updateEntryQuantity: (id: number, quantity: number) =>
    request<Entry>(`/api/entries/${id}`, { method: "PATCH", body: JSON.stringify({ quantity }) }),

  goals: () => request<Goals>("/api/goals"),
  saveGoals: (goals: Goals) =>
    request<{ ok: true }>("/api/goals", { method: "PUT", body: JSON.stringify(goals) }),

  profile: () => request<Profile>("/api/profile"),
  saveProfile: (
    profile: Omit<Profile, "plan">
  ) => request<Profile>("/api/profile", { method: "PUT", body: JSON.stringify(profile) }),

  insights: (month: string) => request<Insights>(`/api/insights?month=${month}`),

  exercise: (date: string) => request<ExerciseResponse>(`/api/exercise?date=${date}`),
  addExerciseEntryFromCatalog: (date: string, exercise_id: number, quantity: number) =>
    request<ExerciseEntry>("/api/exercise", {
      method: "POST",
      body: JSON.stringify({ date, exercise_id, quantity }),
    }),
  addCustomExerciseEntry: (date: string, calories: number, note?: string) =>
    request<ExerciseEntry>("/api/exercise", {
      method: "POST",
      body: JSON.stringify({ date, calories, note }),
    }),
  deleteExercise: (id: number) =>
    request<{ ok: true }>(`/api/exercise/${id}`, { method: "DELETE" }),

  searchExercises: (q: string, muscleGroup?: string) =>
    request<{ exercises: Exercise[] }>(
      `/api/exercises?q=${encodeURIComponent(q)}${muscleGroup ? `&muscle_group=${encodeURIComponent(muscleGroup)}` : ""}`
    ),
  addExerciseToCatalog: (exercise: NewExercise) =>
    request<Exercise>("/api/exercises", { method: "POST", body: JSON.stringify(exercise) }),
};
