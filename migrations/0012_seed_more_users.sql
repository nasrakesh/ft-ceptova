INSERT INTO users (email, password_hash, name) VALUES ('manish@fit-ceptova.local', 'pbkdf2$100000$wMygo8szryjEojHpy2AdkQ$e4s3hbJv90Rnj7FzHajSNlXLX-hR0kdDSsmGau8RB2Y', 'Manish');
INSERT INTO users (email, password_hash, name) VALUES ('prateek@fit-ceptova.local', 'pbkdf2$100000$E7H2bWx1xrdt0uUr_8iJkw$7R-BvAqJdWIjNuRAN0cNWhV6dAz51ElwbejIfw3g-CI', 'Prateek');
INSERT INTO users (email, password_hash, name) VALUES ('omi@fit-ceptova.local', 'pbkdf2$100000$QcqQRYwPd0QIGX7PECmskQ$LUwVLInJalzynZ3-B_DYyFqkd-NBhnYJLTV0cAcJFbE', 'omi');

INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Pre Workout', 0 FROM users WHERE email = 'manish@fit-ceptova.local';
INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Post Workout', 1 FROM users WHERE email = 'manish@fit-ceptova.local';
INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Breakfast', 2 FROM users WHERE email = 'manish@fit-ceptova.local';
INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Mid-afternoon Snack', 3 FROM users WHERE email = 'manish@fit-ceptova.local';
INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Lunch', 4 FROM users WHERE email = 'manish@fit-ceptova.local';
INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Evening Snacks', 5 FROM users WHERE email = 'manish@fit-ceptova.local';
INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Dinner', 6 FROM users WHERE email = 'manish@fit-ceptova.local';

INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Pre Workout', 0 FROM users WHERE email = 'prateek@fit-ceptova.local';
INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Post Workout', 1 FROM users WHERE email = 'prateek@fit-ceptova.local';
INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Breakfast', 2 FROM users WHERE email = 'prateek@fit-ceptova.local';
INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Mid-afternoon Snack', 3 FROM users WHERE email = 'prateek@fit-ceptova.local';
INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Lunch', 4 FROM users WHERE email = 'prateek@fit-ceptova.local';
INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Evening Snacks', 5 FROM users WHERE email = 'prateek@fit-ceptova.local';
INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Dinner', 6 FROM users WHERE email = 'prateek@fit-ceptova.local';

INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Pre Workout', 0 FROM users WHERE email = 'omi@fit-ceptova.local';
INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Post Workout', 1 FROM users WHERE email = 'omi@fit-ceptova.local';
INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Breakfast', 2 FROM users WHERE email = 'omi@fit-ceptova.local';
INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Mid-afternoon Snack', 3 FROM users WHERE email = 'omi@fit-ceptova.local';
INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Lunch', 4 FROM users WHERE email = 'omi@fit-ceptova.local';
INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Evening Snacks', 5 FROM users WHERE email = 'omi@fit-ceptova.local';
INSERT INTO categories (user_id, name, sort_order) SELECT id, 'Dinner', 6 FROM users WHERE email = 'omi@fit-ceptova.local';
