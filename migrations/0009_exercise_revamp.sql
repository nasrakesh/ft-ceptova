-- Add reference instructions to the exercise catalog (used by the Guide tab)
ALTER TABLE exercises ADD COLUMN instructions TEXT;

-- Simple manual calorie-burn logging (Gym / Cardio / Walk / Other) — independent of the
-- catalog-driven per-exercise auto calorie calculation, and never nets against food calories.
ALTER TABLE exercise_entries ADD COLUMN activity_type TEXT NOT NULL DEFAULT 'Gym';

-- Strength progress tracking: occasional weight/reps entries per exercise, viewed as a
-- trend over weeks rather than a daily log.
CREATE TABLE strength_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  weight_kg REAL,
  reps INTEGER,
  sets INTEGER,
  note TEXT,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_strength_logs_user_exercise ON strength_logs(user_id, exercise_name, date);
