# Claude Code Prompt: Nutrition Tracker on Cloudflare

Build me a nutrition/calorie tracking web app, deployed entirely on Cloudflare, using my existing setup:
- Cloudflare Worker name: ft-ceptova
- GitHub repo already connected to this Worker for auto-deploy on push

## TECH STACK (Cloudflare-only, no Vercel/Supabase/Firebase)
- Frontend: React + Vite, built as static assets served directly by the Worker
- Backend: API routes handled inside the same Worker (Hono framework for routing)
- Database: Cloudflare D1 (SQLite) for all data storage
- Auth: simple email + password login, hashed passwords stored in D1, session handled via a signed cookie/JWT issued by the Worker (no third-party auth provider)
- Everything deploys through Wrangler, tied to the existing ft-ceptova Worker and GitHub repo

## PROJECT SETUP
- Set up wrangler.toml with:
  - the Worker name ft-ceptova
  - a [[d1_databases]] binding for the database
  - static asset serving for the built frontend
- Give me the exact Wrangler CLI commands to create and bind the D1 database
- Give me the SQL schema/migration files to set up tables

## DATABASE SCHEMA (D1 / SQLite)
- users: id, email, password_hash, created_at
- categories: id, user_id (FK), name, sort_order
- foods: id, name, unit_label, calories, protein, carbs, fat, fiber, is_global (true for built-in seeded foods, false for a user's custom foods), user_id (nullable — null for global foods, set for custom foods)
- food_entries: id, user_id (FK), category_id (FK), food_id (FK, nullable), custom_name (used only if not linked to a foods row), date, quantity, calories, protein, carbs, fat, fiber, created_at
- goals: user_id (FK, PK), calories, protein, carbs, fat, fiber

Note: food_entries stores the CALCULATED totals (unit values × quantity) at time of logging, not just a multiplier — so historical entries stay accurate even if a food's database values are edited later.

## CORE FEATURE (build and confirm working before anything else)
- Signup/login with email + password (session persists across visits)
- A daily food log, scoped to the logged-in user:
  - Add a food entry: name + calories (number)
  - See a running total of calories for the current day
  - Delete an entry
  - Navigate between days (previous/next day arrows)
- Data stored in D1, tied to user_id, so logging in from any device shows the same synced data

Get this working end-to-end and confirmed before moving to the next section.

## FOOD DATABASE + AUTOFILL

Build a built-in food database of ~40 common foods, each with a defined "unit" (either count-based like "1 egg", "1 banana", or serving-based like "1 bowl cooked rice (150g)", "1 cup milk (240ml)"), and pre-filled nutrition PER THAT UNIT: calories, protein (g), carbs (g), fat (g), fiber (g).

Include foods relevant to these use cases specifically:
- Pre-workout: banana, black coffee, aloo dahi (potato with curd), lemon chia seed water, apple
- Post-workout: whey protein (per scoop), common dry fruits (almonds, cashews, walnuts, raisins — as separate individually loggable items, not one combined entry)
- General: boiled egg, paratha, common sabjis/curries, roti/chapati, cooked rice, dal, paneer, chicken breast, milk, yogurt, oats, bread

Example entries:
- Boiled egg (1 egg): 78 kcal, 6.3g protein, 0.6g carbs, 5.3g fat, 0g fiber
- Banana (1 medium): 105 kcal, 1.3g protein, 27g carbs, 0.4g fat, 3.1g fiber
- Cooked rice (1 bowl, ~150g): 195 kcal, 4g protein, 42g carbs, 0.4g fat, 0.6g fiber
- Roti/chapati (1 piece): 120 kcal, 3g protein, 18g carbs, 3.7g fat, 2g fiber
- Chicken breast, cooked (100g): 165 kcal, 31g protein, 0g carbs, 3.6g fat, 0g fiber

User flow when logging a food:
1. User picks a category (see below), then searches/selects a food from the database
2. User enters ONLY a quantity number (e.g., 2)
3. App automatically calculates and fills in calories/protein/carbs/fat/fiber = (per-unit values × quantity) — user never types nutrition numbers manually for a database food
4. Entry saved to D1 with calculated totals

Store the food database as a seeded table in D1 (the `foods` table above), not hardcoded in the frontend, so it's easy to expand later.

## CUSTOM FOODS (fallback + personal library)

- If a food isn't in the database, user can add a custom food: name + define calories/protein/carbs/fat/fiber for a unit they specify (e.g., "Whey — 1 scoop", "My dry fruit mix — 1 handful")
- Custom foods save to the user's personal food list (`foods` table with `user_id` set, `is_global = false`) and become searchable/reusable from then on, under ANY category — not just where first created
- Support multiple custom variants freely (e.g., different whey flavors, different dry fruit combos each saved separately)
- This should feel like a secondary/rare path — the primary flow is searching the built-in database

## CATEGORIES (user-defined, not hardcoded)

- Categories are NOT fixed to "Breakfast/Lunch/Dinner" — fully user-managed
- User can create a category with any name (e.g., "Pre Workout", "Post Workout", "Breakfast", "Mid-afternoon Snack", "Lunch", "Evening Snacks", "Dinner")
- User can rename, reorder, and delete their own categories
- Seed each new user's account with a default starter set: Pre Workout, Breakfast, Mid-afternoon Snack, Lunch, Evening Snacks, Post Workout, Dinner — editable/deletable afterward
- Every food_entries row is linked to a category_id

## DAILY LOG VIEW

- Grouped by category, in the user's sort order
- Each category shows its logged foods (name, quantity, calories) with a per-category subtotal
- At the top of the day: a summary showing total calories, protein, carbs, fat, fiber consumed so far today
- This summary is shown against the user's daily goals (e.g. "142g / 160g protein")
- Date navigator (previous/next day) to review past days

## GOALS / SETTINGS

- A settings screen where the user sets daily targets: calories, protein (g), carbs (g), fat (g), fiber (g)
- Stored per user in D1 (`goals` table)
- Daily log summary always compares today's totals against these goals

## PWA REQUIREMENTS
- Installable as a PWA ("Add to Home Screen" on mobile)
- manifest.json + service worker for offline caching of the app shell
- Since data lives in D1 (not local), offline mode should gracefully queue new entries and sync them once back online (simple sync-on-reconnect approach)

## DESIGN
- Clean, minimal, mobile-first responsive design (primarily used on phones)
- Feel like a lightweight native app — big tap targets, fast interactions, no clutter
- Light theme, avoid generic "AI app" look — no default purple gradients, no stock SaaS card styling

## BUILD ORDER (confirm each step works before moving to the next)
1. Auth + D1 schema + basic add/view/delete daily entries (manual calorie-only entry), local testing working
2. Full food database + autofill by quantity
3. User-defined categories replacing fixed meal types
4. Custom foods (personal library)
5. Goals/settings screen + daily summary comparing totals to goals
6. PWA installability + offline queue/sync

## DELIVERABLES
- Full working codebase in my existing repo structure
- wrangler.toml correctly configured for ft-ceptova with D1 binding
- SQL migration file(s) for D1 schema
- Exact commands to run locally for testing (wrangler dev) and to deploy (confirm auto-deploy via GitHub push, plus the manual command as fallback)
- Confirm the app runs locally and connects to D1 correctly before I push to deploy

Start with step 1 only, show me it's functional, then proceed through the build order one step at a time.
