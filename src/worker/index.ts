import { Hono, type Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Env, Variables } from "./types";
import { createSessionToken, hashPassword, verifyPassword, verifySessionToken } from "./auth";
import { computePlan, type ActivityLevel, type GoalType, type Profile, type Sex } from "./plan";

type AppEnv = { Bindings: Env; Variables: Variables };

const app = new Hono<AppEnv>();

const SESSION_COOKIE = "session";

const DEFAULT_CATEGORIES = [
  "Pre Workout",
  "Post Workout",
  "Breakfast",
  "Mid-afternoon Snack",
  "Lunch",
  "Evening Snacks",
  "Dinner",
];

const GOAL_FIELDS = ["calories", "protein", "carbs", "fat", "fiber"] as const;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isFiniteNonNegative(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

async function readJson<T extends object>(c: Context<AppEnv>): Promise<Partial<T>> {
  return c.req.json<T>().catch(() => ({}) as Partial<T>);
}

async function requireAuth(c: Context<AppEnv>, next: () => Promise<void>) {
  const token = getCookie(c, SESSION_COOKIE);
  const userId = token ? await verifySessionToken(token, c.env.SESSION_SECRET) : null;
  if (!userId) {
    return c.json({ error: "Not authenticated" }, 401);
  }
  c.set("userId", userId);
  await next();
}

async function setSessionCookie(c: Context<AppEnv>, userId: number) {
  const token = await createSessionToken(userId, c.env.SESSION_SECRET);
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

async function assertOwnsCategory(env: Env, userId: number, categoryId: number): Promise<boolean> {
  const row = await env.DB.prepare("SELECT id FROM categories WHERE id = ? AND user_id = ?")
    .bind(categoryId, userId)
    .first();
  return !!row;
}

app.post("/api/auth/signup", async (c) => {
  const body = await readJson<{ email?: string; password?: string }>(c);
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !isValidEmail(email)) {
    return c.json({ error: "Valid email is required" }, 400);
  }
  if (!password || password.length < 8) {
    return c.json({ error: "Password must be at least 8 characters" }, 400);
  }

  const existing = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first();
  if (existing) {
    return c.json({ error: "An account with this email already exists" }, 409);
  }

  const passwordHash = await hashPassword(password);
  const result = await c.env.DB.prepare(
    "INSERT INTO users (email, password_hash) VALUES (?, ?)"
  )
    .bind(email, passwordHash)
    .run();
  const userId = result.meta.last_row_id as number;

  const insertCategory = c.env.DB.prepare(
    "INSERT INTO categories (user_id, name, sort_order) VALUES (?, ?, ?)"
  );
  await c.env.DB.batch(
    DEFAULT_CATEGORIES.map((name, i) => insertCategory.bind(userId, name, i))
  );

  await setSessionCookie(c, userId);
  return c.json({ id: userId, email });
});

app.post("/api/auth/login", async (c) => {
  const body = await readJson<{ email?: string; password?: string }>(c);
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  const user = await c.env.DB.prepare(
    "SELECT id, email, password_hash FROM users WHERE email = ?"
  )
    .bind(email)
    .first<{ id: number; email: string; password_hash: string }>();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  await setSessionCookie(c, user.id);
  return c.json({ id: user.id, email: user.email });
});

app.post("/api/auth/logout", async (c) => {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
});

app.get("/api/auth/me", async (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  const userId = token ? await verifySessionToken(token, c.env.SESSION_SECRET) : null;
  if (!userId) return c.json({ error: "Not authenticated" }, 401);

  const user = await c.env.DB.prepare("SELECT id, email FROM users WHERE id = ?")
    .bind(userId)
    .first<{ id: number; email: string }>();
  if (!user) return c.json({ error: "Not authenticated" }, 401);
  return c.json(user);
});

// ---------- Categories ----------

app.get("/api/categories", requireAuth, async (c) => {
  const userId = c.get("userId");
  const { results } = await c.env.DB.prepare(
    "SELECT id, name, sort_order FROM categories WHERE user_id = ? ORDER BY sort_order ASC"
  )
    .bind(userId)
    .all();
  return c.json({ categories: results });
});

app.post("/api/categories", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await readJson<{ name?: string }>(c);
  const name = body.name?.trim();
  if (!name) return c.json({ error: "Name is required" }, 400);

  const max = await c.env.DB.prepare(
    "SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM categories WHERE user_id = ?"
  )
    .bind(userId)
    .first<{ maxOrder: number }>();
  const sortOrder = (max?.maxOrder ?? -1) + 1;

  const result = await c.env.DB.prepare(
    "INSERT INTO categories (user_id, name, sort_order) VALUES (?, ?, ?)"
  )
    .bind(userId, name, sortOrder)
    .run();

  return c.json({ id: result.meta.last_row_id, name, sort_order: sortOrder }, 201);
});

app.patch("/api/categories/:id", requireAuth, async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const body = await readJson<{ name?: string }>(c);
  const name = body.name?.trim();
  if (!name) return c.json({ error: "Name is required" }, 400);

  const result = await c.env.DB.prepare(
    "UPDATE categories SET name = ? WHERE id = ? AND user_id = ?"
  )
    .bind(name, id, userId)
    .run();
  if (result.meta.changes === 0) return c.json({ error: "Category not found" }, 404);
  return c.json({ ok: true });
});

app.put("/api/categories/reorder", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await readJson<{ order?: number[] }>(c);
  const order = body.order;
  if (!Array.isArray(order) || order.length === 0) {
    return c.json({ error: "order must be a non-empty array of category ids" }, 400);
  }

  const owned = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM categories WHERE user_id = ? AND id IN (${order
      .map(() => "?")
      .join(",")})`
  )
    .bind(userId, ...order)
    .first<{ n: number }>();
  if (!owned || owned.n !== order.length) {
    return c.json({ error: "Invalid category ids" }, 400);
  }

  const update = c.env.DB.prepare(
    "UPDATE categories SET sort_order = ? WHERE id = ? AND user_id = ?"
  );
  await c.env.DB.batch(order.map((id, i) => update.bind(i, id, userId)));
  return c.json({ ok: true });
});

app.delete("/api/categories/:id", requireAuth, async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  const remaining = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM categories WHERE user_id = ?"
  )
    .bind(userId)
    .first<{ n: number }>();
  if ((remaining?.n ?? 0) <= 1) {
    return c.json({ error: "You must keep at least one category" }, 400);
  }

  const result = await c.env.DB.prepare(
    "DELETE FROM categories WHERE id = ? AND user_id = ?"
  )
    .bind(id, userId)
    .run();
  if (result.meta.changes === 0) return c.json({ error: "Category not found" }, 404);
  return c.json({ ok: true });
});

// ---------- Foods ----------

app.get("/api/foods", requireAuth, async (c) => {
  const userId = c.get("userId");
  const q = (c.req.query("q") || "").trim();

  let query =
    "SELECT id, name, unit_label, calories, protein, carbs, fat, fiber, is_global FROM foods WHERE (is_global = 1 OR user_id = ?)";
  const params: (string | number)[] = [userId];

  if (q) {
    query += " AND name LIKE ? ESCAPE '\\'";
    const escaped = q.replace(/[\\%_]/g, (ch) => `\\${ch}`);
    params.push(`%${escaped}%`);
  }
  query += " ORDER BY is_global DESC, name ASC LIMIT 50";

  const { results } = await c.env.DB.prepare(query)
    .bind(...params)
    .all();
  return c.json({ foods: results });
});

app.post("/api/foods", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await readJson<{
    name?: string;
    unit_label?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  }>(c);

  const name = body.name?.trim();
  const unitLabel = body.unit_label?.trim();
  const calories = body.calories;
  const protein = body.protein ?? 0;
  const carbs = body.carbs ?? 0;
  const fat = body.fat ?? 0;
  const fiber = body.fiber ?? 0;

  if (!name) return c.json({ error: "Name is required" }, 400);
  if (!unitLabel) return c.json({ error: "Unit is required (e.g. '1 scoop')" }, 400);
  if (!isFiniteNonNegative(calories)) {
    return c.json({ error: "Calories must be a non-negative number" }, 400);
  }
  for (const [label, val] of [
    ["Protein", protein],
    ["Carbs", carbs],
    ["Fat", fat],
    ["Fiber", fiber],
  ] as const) {
    if (!isFiniteNonNegative(val)) {
      return c.json({ error: `${label} must be a non-negative number` }, 400);
    }
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO foods (name, unit_label, calories, protein, carbs, fat, fiber, is_global, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`
  )
    .bind(name, unitLabel, calories, protein, carbs, fat, fiber, userId)
    .run();

  const food = await c.env.DB.prepare(
    "SELECT id, name, unit_label, calories, protein, carbs, fat, fiber, is_global FROM foods WHERE id = ?"
  )
    .bind(result.meta.last_row_id)
    .first();

  return c.json(food, 201);
});

// ---------- Food entries ----------

app.get("/api/entries", requireAuth, async (c) => {
  const userId = c.get("userId");
  const date = c.req.query("date") || todayIso();

  const { results } = await c.env.DB.prepare(
    `SELECT id, category_id, food_id, custom_name, date, quantity, calories, protein, carbs, fat, fiber, created_at
     FROM food_entries WHERE user_id = ? AND date = ? ORDER BY created_at ASC`
  )
    .bind(userId, date)
    .all();

  const entries = results as any[];
  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
      fiber: acc.fiber + e.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  return c.json({ date, entries, totals });
});

app.post("/api/entries", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await readJson<{
    category_id?: number;
    date?: string;
    quantity?: number;
    food_id?: number;
    custom_name?: string;
    calories?: number;
  }>(c);

  const categoryId = body.category_id;
  const date = body.date || todayIso();
  const quantity = body.quantity ?? 1;

  if (typeof categoryId !== "number") return c.json({ error: "category_id is required" }, 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: "Date must be in YYYY-MM-DD format" }, 400);
  }
  if (!isFiniteNonNegative(quantity) || quantity <= 0) {
    return c.json({ error: "Quantity must be a positive number" }, 400);
  }
  if (!(await assertOwnsCategory(c.env, userId, categoryId))) {
    return c.json({ error: "Category not found" }, 404);
  }

  let insertValues: {
    foodId: number | null;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };

  if (typeof body.food_id === "number") {
    const food = await c.env.DB.prepare(
      "SELECT id, name, calories, protein, carbs, fat, fiber FROM foods WHERE id = ? AND (is_global = 1 OR user_id = ?)"
    )
      .bind(body.food_id, userId)
      .first<{
        id: number;
        name: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
      }>();
    if (!food) return c.json({ error: "Food not found" }, 404);

    insertValues = {
      foodId: food.id,
      name: food.name,
      calories: food.calories * quantity,
      protein: food.protein * quantity,
      carbs: food.carbs * quantity,
      fat: food.fat * quantity,
      fiber: food.fiber * quantity,
    };
  } else {
    const name = body.custom_name?.trim();
    const calories = body.calories;
    if (!name) return c.json({ error: "Name is required" }, 400);
    if (!isFiniteNonNegative(calories)) {
      return c.json({ error: "Calories must be a non-negative number" }, 400);
    }
    insertValues = { foodId: null, name, calories, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO food_entries
       (user_id, category_id, food_id, custom_name, date, quantity, calories, protein, carbs, fat, fiber)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      userId,
      categoryId,
      insertValues.foodId,
      insertValues.name,
      date,
      quantity,
      insertValues.calories,
      insertValues.protein,
      insertValues.carbs,
      insertValues.fat,
      insertValues.fiber
    )
    .run();

  const entry = await c.env.DB.prepare(
    `SELECT id, category_id, food_id, custom_name, date, quantity, calories, protein, carbs, fat, fiber, created_at
     FROM food_entries WHERE id = ?`
  )
    .bind(result.meta.last_row_id)
    .first();

  return c.json(entry, 201);
});

app.patch("/api/entries/:id", requireAuth, async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const body = await readJson<{ quantity?: number }>(c);
  const quantity = body.quantity;

  if (!isFiniteNonNegative(quantity) || quantity <= 0) {
    return c.json({ error: "Quantity must be a positive number" }, 400);
  }

  const entry = await c.env.DB.prepare(
    "SELECT id, food_id FROM food_entries WHERE id = ? AND user_id = ?"
  )
    .bind(id, userId)
    .first<{ id: number; food_id: number | null }>();
  if (!entry) return c.json({ error: "Entry not found" }, 404);
  if (entry.food_id === null) {
    return c.json({ error: "This entry can't have its quantity edited" }, 400);
  }

  const food = await c.env.DB.prepare(
    "SELECT calories, protein, carbs, fat, fiber FROM foods WHERE id = ?"
  )
    .bind(entry.food_id)
    .first<{ calories: number; protein: number; carbs: number; fat: number; fiber: number }>();
  if (!food) return c.json({ error: "Underlying food no longer exists" }, 409);

  await c.env.DB.prepare(
    `UPDATE food_entries SET quantity = ?, calories = ?, protein = ?, carbs = ?, fat = ?, fiber = ?
     WHERE id = ? AND user_id = ?`
  )
    .bind(
      quantity,
      food.calories * quantity,
      food.protein * quantity,
      food.carbs * quantity,
      food.fat * quantity,
      food.fiber * quantity,
      id,
      userId
    )
    .run();

  const updated = await c.env.DB.prepare(
    `SELECT id, category_id, food_id, custom_name, date, quantity, calories, protein, carbs, fat, fiber, created_at
     FROM food_entries WHERE id = ?`
  )
    .bind(id)
    .first();

  return c.json(updated);
});

app.delete("/api/entries/:id", requireAuth, async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  const result = await c.env.DB.prepare(
    "DELETE FROM food_entries WHERE id = ? AND user_id = ?"
  )
    .bind(id, userId)
    .run();

  if (result.meta.changes === 0) {
    return c.json({ error: "Entry not found" }, 404);
  }
  return c.json({ ok: true });
});

// ---------- Exercise catalog ----------

app.get("/api/exercises", requireAuth, async (c) => {
  const userId = c.get("userId");
  const q = (c.req.query("q") || "").trim();
  const muscleGroup = c.req.query("muscle_group");

  let query =
    "SELECT id, name, muscle_group, unit_label, avg_calories, is_global FROM exercises WHERE (is_global = 1 OR user_id = ?)";
  const params: (string | number)[] = [userId];

  if (muscleGroup) {
    query += " AND muscle_group = ?";
    params.push(muscleGroup);
  }
  if (q) {
    query += " AND name LIKE ? ESCAPE '\\'";
    const escaped = q.replace(/[\\%_]/g, (ch) => `\\${ch}`);
    params.push(`%${escaped}%`);
  }
  query += " ORDER BY is_global DESC, name ASC LIMIT 50";

  const { results } = await c.env.DB.prepare(query)
    .bind(...params)
    .all();
  return c.json({ exercises: results });
});

app.post("/api/exercises", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await readJson<{
    name?: string;
    muscle_group?: string;
    unit_label?: string;
    avg_calories?: number;
  }>(c);

  const name = body.name?.trim();
  const muscleGroup = body.muscle_group?.trim();
  const unitLabel = body.unit_label?.trim();
  const avgCalories = body.avg_calories;

  if (!name) return c.json({ error: "Name is required" }, 400);
  if (!muscleGroup) return c.json({ error: "Muscle group is required" }, 400);
  if (!unitLabel) return c.json({ error: "Unit is required (e.g. '3 sets')" }, 400);
  if (!isFiniteNonNegative(avgCalories)) {
    return c.json({ error: "Average calories must be a non-negative number" }, 400);
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO exercises (name, muscle_group, unit_label, avg_calories, is_global, user_id)
     VALUES (?, ?, ?, ?, 0, ?)`
  )
    .bind(name, muscleGroup, unitLabel, avgCalories, userId)
    .run();

  const exercise = await c.env.DB.prepare(
    "SELECT id, name, muscle_group, unit_label, avg_calories, is_global FROM exercises WHERE id = ?"
  )
    .bind(result.meta.last_row_id)
    .first();

  return c.json(exercise, 201);
});

// ---------- Exercise log ----------

app.get("/api/exercise", requireAuth, async (c) => {
  const userId = c.get("userId");
  const date = c.req.query("date") || todayIso();

  const { results } = await c.env.DB.prepare(
    `SELECT ee.id, ee.exercise_id, ee.note, ee.quantity, ee.calories, ee.created_at, ex.muscle_group
     FROM exercise_entries ee
     LEFT JOIN exercises ex ON ee.exercise_id = ex.id
     WHERE ee.user_id = ? AND ee.date = ?
     ORDER BY ee.created_at ASC`
  )
    .bind(userId, date)
    .all();

  const entries = results as Array<{ calories: number }>;
  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);
  return c.json({ date, entries: results, totalCalories });
});

app.post("/api/exercise", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await readJson<{
    date?: string;
    exercise_id?: number;
    quantity?: number;
    calories?: number;
    note?: string;
  }>(c);
  const date = body.date || todayIso();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: "Date must be in YYYY-MM-DD format" }, 400);
  }

  let exerciseId: number | null = null;
  let quantity = 1;
  let calories: number;
  let note: string | null;

  if (typeof body.exercise_id === "number") {
    quantity = body.quantity ?? 1;
    if (!isFiniteNonNegative(quantity) || quantity <= 0) {
      return c.json({ error: "Quantity must be a positive number" }, 400);
    }
    const exercise = await c.env.DB.prepare(
      "SELECT id, name, avg_calories FROM exercises WHERE id = ? AND (is_global = 1 OR user_id = ?)"
    )
      .bind(body.exercise_id, userId)
      .first<{ id: number; name: string; avg_calories: number }>();
    if (!exercise) return c.json({ error: "Exercise not found" }, 404);

    exerciseId = exercise.id;
    calories = exercise.avg_calories * quantity;
    note = exercise.name;
  } else {
    calories = body.calories as number;
    if (!isFiniteNonNegative(calories)) {
      return c.json({ error: "Calories must be a non-negative number" }, 400);
    }
    note = body.note?.trim() || null;
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO exercise_entries (user_id, date, calories, note, exercise_id, quantity) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(userId, date, calories, note, exerciseId, quantity)
    .run();

  const entry = await c.env.DB.prepare(
    `SELECT ee.id, ee.exercise_id, ee.note, ee.quantity, ee.calories, ee.created_at, ex.muscle_group
     FROM exercise_entries ee
     LEFT JOIN exercises ex ON ee.exercise_id = ex.id
     WHERE ee.id = ?`
  )
    .bind(result.meta.last_row_id)
    .first();

  return c.json(entry, 201);
});

app.delete("/api/exercise/:id", requireAuth, async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  const result = await c.env.DB.prepare(
    "DELETE FROM exercise_entries WHERE id = ? AND user_id = ?"
  )
    .bind(id, userId)
    .run();

  if (result.meta.changes === 0) {
    return c.json({ error: "Entry not found" }, 404);
  }
  return c.json({ ok: true });
});

// ---------- Goals ----------

app.get("/api/goals", requireAuth, async (c) => {
  const userId = c.get("userId");
  const goals = await c.env.DB.prepare(
    "SELECT calories, protein, carbs, fat, fiber FROM goals WHERE user_id = ?"
  )
    .bind(userId)
    .first();
  return c.json(goals ?? { calories: null, protein: null, carbs: null, fat: null, fiber: null });
});

app.put("/api/goals", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await c.req
    .json<Record<(typeof GOAL_FIELDS)[number], number | null | undefined>>()
    .catch(() => ({}) as any);

  const values: Record<string, number | null> = {};
  for (const field of GOAL_FIELDS) {
    const v = body[field];
    if (v === null || v === undefined) {
      values[field] = null;
    } else if (isFiniteNonNegative(v)) {
      values[field] = v;
    } else {
      return c.json({ error: `${field} must be a non-negative number or null` }, 400);
    }
  }

  await c.env.DB.prepare(
    `INSERT INTO goals (user_id, calories, protein, carbs, fat, fiber)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       calories = excluded.calories,
       protein = excluded.protein,
       carbs = excluded.carbs,
       fat = excluded.fat,
       fiber = excluded.fiber`
  )
    .bind(userId, values.calories, values.protein, values.carbs, values.fat, values.fiber)
    .run();

  return c.json({ ok: true });
});

// ---------- Profile, BMI & weight plan ----------

const SEX_VALUES: Sex[] = ["male", "female"];
const ACTIVITY_VALUES: ActivityLevel[] = ["sedentary", "light", "moderate", "active", "very_active"];
const GOAL_TYPE_VALUES: GoalType[] = ["lose", "maintain", "gain"];

async function fetchProfile(env: Env, userId: number): Promise<Profile> {
  const row = await env.DB.prepare(
    `SELECT height_cm, current_weight_kg, target_weight_kg, age, sex, activity_level, goal_type, target_weeks
     FROM profiles WHERE user_id = ?`
  )
    .bind(userId)
    .first<Profile>();
  return (
    row ?? {
      height_cm: null,
      current_weight_kg: null,
      target_weight_kg: null,
      age: null,
      sex: null,
      activity_level: null,
      goal_type: null,
      target_weeks: null,
    }
  );
}

app.get("/api/profile", requireAuth, async (c) => {
  const profile = await fetchProfile(c.env, c.get("userId"));
  return c.json({ ...profile, plan: computePlan(profile) });
});

app.put("/api/profile", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await readJson<{
    height_cm?: number | null;
    current_weight_kg?: number | null;
    target_weight_kg?: number | null;
    age?: number | null;
    sex?: Sex | null;
    activity_level?: ActivityLevel | null;
    goal_type?: GoalType | null;
    target_weeks?: number | null;
  }>(c);

  function numOrNull(v: unknown, label: string): number | null {
    if (v === null || v === undefined) return null;
    if (!isFiniteNonNegative(v)) throw new Error(`${label} must be a non-negative number or null`);
    return v;
  }

  let profile: Profile;
  try {
    profile = {
      height_cm: numOrNull(body.height_cm, "Height"),
      current_weight_kg: numOrNull(body.current_weight_kg, "Current weight"),
      target_weight_kg: numOrNull(body.target_weight_kg, "Target weight"),
      age: numOrNull(body.age, "Age"),
      sex: body.sex == null ? null : body.sex,
      activity_level: body.activity_level == null ? null : body.activity_level,
      goal_type: body.goal_type == null ? null : body.goal_type,
      target_weeks: numOrNull(body.target_weeks, "Target weeks"),
    };
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Invalid input" }, 400);
  }

  if (profile.sex != null && !SEX_VALUES.includes(profile.sex)) {
    return c.json({ error: "sex must be 'male' or 'female'" }, 400);
  }
  if (profile.activity_level != null && !ACTIVITY_VALUES.includes(profile.activity_level)) {
    return c.json({ error: "Invalid activity_level" }, 400);
  }
  if (profile.goal_type != null && !GOAL_TYPE_VALUES.includes(profile.goal_type)) {
    return c.json({ error: "goal_type must be 'lose', 'maintain', or 'gain'" }, 400);
  }

  await c.env.DB.prepare(
    `INSERT INTO profiles
       (user_id, height_cm, current_weight_kg, target_weight_kg, age, sex, activity_level, goal_type, target_weeks, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
       height_cm = excluded.height_cm,
       current_weight_kg = excluded.current_weight_kg,
       target_weight_kg = excluded.target_weight_kg,
       age = excluded.age,
       sex = excluded.sex,
       activity_level = excluded.activity_level,
       goal_type = excluded.goal_type,
       target_weeks = excluded.target_weeks,
       updated_at = datetime('now')`
  )
    .bind(
      userId,
      profile.height_cm,
      profile.current_weight_kg,
      profile.target_weight_kg,
      profile.age,
      profile.sex,
      profile.activity_level,
      profile.goal_type,
      profile.target_weeks
    )
    .run();

  return c.json({ ...profile, plan: computePlan(profile) });
});

// ---------- Insights ----------

app.get("/api/insights", requireAuth, async (c) => {
  const userId = c.get("userId");
  const month = c.req.query("month") || todayIso().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return c.json({ error: "month must be in YYYY-MM format" }, 400);
  }

  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const startDate = `${month}-01`;
  const endDate = `${month}-${String(daysInMonth).padStart(2, "0")}`;

  const { results } = await c.env.DB.prepare(
    `SELECT date,
            SUM(calories) AS calories,
            SUM(protein) AS protein,
            SUM(carbs) AS carbs,
            SUM(fat) AS fat,
            SUM(fiber) AS fiber
     FROM food_entries
     WHERE user_id = ? AND date >= ? AND date <= ?
     GROUP BY date
     ORDER BY date ASC`
  )
    .bind(userId, startDate, endDate)
    .all();

  const days = results as Array<{
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  }>;

  const daysLogged = days.length;
  const totals = days.reduce(
    (acc, d) => ({
      calories: acc.calories + d.calories,
      protein: acc.protein + d.protein,
      carbs: acc.carbs + d.carbs,
      fat: acc.fat + d.fat,
      fiber: acc.fiber + d.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
  const averages =
    daysLogged > 0
      ? {
          calories: totals.calories / daysLogged,
          protein: totals.protein / daysLogged,
          carbs: totals.carbs / daysLogged,
          fat: totals.fat / daysLogged,
          fiber: totals.fiber / daysLogged,
        }
      : { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

  const goals = await c.env.DB.prepare(
    "SELECT calories, protein, carbs, fat, fiber FROM goals WHERE user_id = ?"
  )
    .bind(userId)
    .first();

  const profile = await fetchProfile(c.env, userId);

  return c.json({
    month,
    daysInMonth,
    days,
    daysLogged,
    totals,
    averages,
    goals: goals ?? { calories: null, protein: null, carbs: null, fat: null, fiber: null },
    plan: computePlan(profile),
  });
});

app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
