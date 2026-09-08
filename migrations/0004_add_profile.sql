CREATE TABLE profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  height_cm REAL,
  current_weight_kg REAL,
  target_weight_kg REAL,
  age INTEGER,
  sex TEXT,
  activity_level TEXT,
  goal_type TEXT,
  target_weeks INTEGER,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
