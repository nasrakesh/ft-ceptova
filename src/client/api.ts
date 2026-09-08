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

export const api = {
  me: () => request<User>("/api/auth/me"),
  signup: (email: string, password: string) =>
    request<User>("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    request<User>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),

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
};
