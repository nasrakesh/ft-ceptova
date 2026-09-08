CREATE TABLE exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  unit_label TEXT NOT NULL,
  avg_calories REAL NOT NULL,
  is_global INTEGER NOT NULL DEFAULT 0,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX idx_exercises_user ON exercises(user_id);

ALTER TABLE exercise_entries ADD COLUMN exercise_id INTEGER REFERENCES exercises(id);
ALTER TABLE exercise_entries ADD COLUMN quantity REAL NOT NULL DEFAULT 1;
