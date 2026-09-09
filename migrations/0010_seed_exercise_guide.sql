-- Add cue/instruction text to the existing global catalog entries
UPDATE exercises SET instructions = 'Grip the bar wider than shoulders, hang fully, pull your chest to the bar leading with your elbows.' WHERE name = 'Pull up' AND is_global = 1;
UPDATE exercises SET instructions = 'Sit tall, pull the bar to your upper chest, squeeze your shoulder blades together, control the release.' WHERE name = 'Lat pulldown' AND is_global = 1;
UPDATE exercises SET instructions = 'Hinge at the hips with a flat back, grip the bar outside your knees, drive through your heels to stand tall.' WHERE name = 'Deadlift' AND is_global = 1;
UPDATE exercises SET instructions = 'Hinge forward ~45°, keep a flat back, row the bar to your lower ribs, squeeze your back at the top.' WHERE name = 'Bent-over row' AND is_global = 1;

UPDATE exercises SET instructions = 'Hands slightly wider than shoulders, lower your chest to the floor keeping a straight line, press back up.' WHERE name = 'Push-up' AND is_global = 1;
UPDATE exercises SET instructions = 'Lie on a flat bench, lower the bar to mid-chest, press up until arms are extended without locking hard.' WHERE name = 'Bench press' AND is_global = 1;
UPDATE exercises SET instructions = 'Lie flat, arc the dumbbells out and down with a slight elbow bend, squeeze your chest to bring them back up.' WHERE name = 'Chest fly' AND is_global = 1;

UPDATE exercises SET instructions = 'Press the dumbbells or bar straight overhead from shoulder height, avoid arching your lower back.' WHERE name = 'Shoulder press' AND is_global = 1;
UPDATE exercises SET instructions = 'Raise dumbbells out to your sides to shoulder height with a soft elbow bend, lower slowly.' WHERE name = 'Lateral raise' AND is_global = 1;

UPDATE exercises SET instructions = 'Support yourself on parallel bars or a bench, lower until elbows hit ~90°, press back up.' WHERE name = 'Tricep dips' AND is_global = 1;
UPDATE exercises SET instructions = 'Keep elbows pinned to your sides, push the cable bar down until arms are straight, control the return.' WHERE name = 'Tricep pushdown' AND is_global = 1;

UPDATE exercises SET instructions = 'Keep elbows close to your torso, curl the weight up without swinging, squeeze at the top.' WHERE name = 'Bicep curl' AND is_global = 1;
UPDATE exercises SET instructions = 'Hold dumbbells with a neutral (palms-in) grip, curl straight up keeping wrists locked.' WHERE name = 'Hammer curl' AND is_global = 1;

UPDATE exercises SET instructions = 'Feet shoulder-width apart, sit your hips back and down keeping your chest up, drive through your heels.' WHERE name = 'Squats' AND is_global = 1;
UPDATE exercises SET instructions = 'Step forward into a long stride, lower the back knee toward the floor, push back to standing.' WHERE name = 'Lunges' AND is_global = 1;
UPDATE exercises SET instructions = 'Sit in the machine, feet shoulder-width on the platform, press out without locking your knees, control the return.' WHERE name = 'Leg press' AND is_global = 1;

UPDATE exercises SET instructions = 'Lie flat, brace your core, curl your knees up toward your chest without swinging.' WHERE name = 'Crunches' AND is_global = 1;
UPDATE exercises SET instructions = 'Hold a straight line from head to heels on forearms and toes, keep hips level, breathe steadily.' WHERE name = 'Plank' AND is_global = 1;
UPDATE exercises SET instructions = 'Lie flat, keep legs straight, raise them to vertical while keeping your lower back pressed down.' WHERE name = 'Leg raises' AND is_global = 1;

UPDATE exercises SET instructions = 'Keep a light, steady pace at a conversational effort or push the incline for a harder effort.' WHERE name = 'Treadmill running' AND is_global = 1;
UPDATE exercises SET instructions = 'Maintain a steady cadence, adjust resistance to keep a moderate-to-hard effort.' WHERE name = 'Cycling' AND is_global = 1;
UPDATE exercises SET instructions = 'Small wrist turns, jump just high enough to clear the rope, land softly on the balls of your feet.' WHERE name = 'Jump rope' AND is_global = 1;

-- Additional exercises to bring every muscle group up to ~10-12 reference entries
INSERT INTO exercises (name, muscle_group, unit_label, avg_calories, is_global, user_id, instructions) VALUES
('Seated cable row', 'Back', '3 sets', 35, 1, NULL, 'Sit with knees slightly bent, pull the handle to your abdomen while keeping your back straight, squeeze your shoulder blades.'),
('T-bar row', 'Back', '3 sets', 45, 1, NULL, 'Hinge over the bar with a flat back, row the weight to your chest, squeeze at the top before lowering.'),
('Single-arm dumbbell row', 'Back', '3 sets', 35, 1, NULL, 'Support yourself on a bench with one hand and knee, row the dumbbell to your hip, keep your torso still.'),
('Straight-arm pulldown', 'Back', '3 sets', 30, 1, NULL, 'Keep arms straight, pull the bar down from overhead to your thighs using your lats, not your arms.'),
('Face pull', 'Back', '3 sets', 25, 1, NULL, 'Pull the rope toward your face at eye level, flare elbows out, squeeze your rear shoulders and upper back.'),
('Superman', 'Back', '3 sets (12 reps)', 20, 1, NULL, 'Lie face down, simultaneously lift arms, chest and legs off the floor, hold briefly, lower with control.'),
('Good morning', 'Back', '3 sets', 30, 1, NULL, 'Bar on your upper back, hinge forward at the hips keeping a flat back, return by driving your hips forward.'),
('Renegade row', 'Back', '3 sets', 35, 1, NULL, 'In a plank on dumbbells, row one at a time to your ribs while keeping your hips square and stable.'),

('Incline bench press', 'Chest', '3 sets', 50, 1, NULL, 'On an inclined bench, lower the bar/dumbbells to your upper chest, press up and slightly back.'),
('Cable crossover', 'Chest', '3 sets', 35, 1, NULL, 'Standing between cable towers, pull both handles down and together in front of your chest, squeeze hard.'),
('Decline bench press', 'Chest', '3 sets', 50, 1, NULL, 'On a declined bench, lower the bar to your lower chest, press up until arms extend.'),
('Dumbbell pullover', 'Chest', '3 sets', 35, 1, NULL, 'Lying across a bench, lower one dumbbell behind your head with slightly bent arms, pull it back over your chest.'),
('Weighted dips', 'Chest', '3 sets', 40, 1, NULL, 'Lean forward on the dip bars, lower until your shoulders are below your elbows, press back up.'),
('Landmine press', 'Chest', '3 sets', 35, 1, NULL, 'Hold the bar end at shoulder height, press it up and forward at an angle, control the descent.'),
('Incline dumbbell press', 'Chest', '3 sets', 45, 1, NULL, 'On an inclined bench, press the dumbbells up over your upper chest until arms extend.'),

('Front raise', 'Shoulder', '3 sets', 25, 1, NULL, 'Raise a dumbbell or plate straight in front of you to shoulder height, lower with control.'),
('Rear delt fly', 'Shoulder', '3 sets', 25, 1, NULL, 'Bend forward slightly, raise dumbbells out to the sides squeezing your rear shoulders, avoid using momentum.'),
('Arnold press', 'Shoulder', '3 sets', 40, 1, NULL, 'Start with palms facing you, press overhead while rotating palms to face forward at the top.'),
('Upright row', 'Shoulder', '3 sets', 30, 1, NULL, 'Pull the bar up close to your body to chest height, leading with your elbows, lower slowly.'),
('Shrugs', 'Shoulder', '3 sets', 25, 1, NULL, 'Hold dumbbells at your sides, lift your shoulders straight up toward your ears, hold briefly, lower.'),
('Cable lateral raise', 'Shoulder', '3 sets', 25, 1, NULL, 'Stand side-on to a low cable, raise the handle out to shoulder height with a soft elbow bend.'),
('Pike push-up', 'Shoulder', '3 sets', 30, 1, NULL, 'In a pike position with hips high, lower your head toward the floor between your hands, press back up.'),

('Overhead tricep extension', 'Triceps', '3 sets', 30, 1, NULL, 'Hold a dumbbell overhead with both hands, lower it behind your head, extend back up without flaring elbows.'),
('Close-grip bench press', 'Triceps', '3 sets', 40, 1, NULL, 'Grip the bar shoulder-width or closer, lower to your chest keeping elbows tucked, press up.'),
('Skull crushers', 'Triceps', '3 sets', 30, 1, NULL, 'Lying down, lower the bar toward your forehead by bending only at the elbows, extend back up.'),
('Diamond push-up', 'Triceps', '3 sets', 25, 1, NULL, 'Form a diamond shape with your hands under your chest, lower and press up, keeping elbows close.'),
('Tricep kickback', 'Triceps', '3 sets', 20, 1, NULL, 'Hinge forward, keep your upper arm still, extend the dumbbell straight back until your arm is locked out.'),
('Rope pushdown', 'Triceps', '3 sets', 25, 1, NULL, 'Push the rope down and apart at the bottom, keep elbows pinned to your sides throughout.'),
('Bench dips', 'Triceps', '3 sets', 25, 1, NULL, 'Hands on a bench behind you, legs extended, lower your hips toward the floor and press back up.'),

('Concentration curl', 'Biceps', '3 sets', 20, 1, NULL, 'Elbow braced against your inner thigh, curl the dumbbell up slowly, squeeze at the top.'),
('Preacher curl', 'Biceps', '3 sets', 25, 1, NULL, 'Rest your arms on the preacher pad, curl the weight up fully, lower under control without swinging.'),
('Cable curl', 'Biceps', '3 sets', 25, 1, NULL, 'Standing at a low cable, curl the bar up keeping elbows fixed at your sides.'),
('Incline dumbbell curl', 'Biceps', '3 sets', 25, 1, NULL, 'Sit back on an incline bench, let arms hang straight down, curl without swinging your shoulders forward.'),
('Reverse curl', 'Biceps', '3 sets', 20, 1, NULL, 'Grip the bar with palms facing down, curl up keeping wrists straight to target the forearms and biceps.'),
('Zottman curl', 'Biceps', '3 sets', 25, 1, NULL, 'Curl up with palms facing up, rotate palms down at the top, lower slowly in that reversed grip.'),
('EZ-bar curl', 'Biceps', '3 sets', 25, 1, NULL, 'Grip the angled bar, curl up keeping elbows tucked, avoid rocking your torso.'),

('Romanian deadlift', 'Legs', '3 sets', 45, 1, NULL, 'Slight knee bend, push your hips back while lowering the bar along your legs, feel a hamstring stretch.'),
('Leg extension', 'Legs', '3 sets', 30, 1, NULL, 'Sit in the machine, extend your knees to lift the pad, pause briefly, lower with control.'),
('Leg curl', 'Legs', '3 sets', 30, 1, NULL, 'Lying or seated, curl the pad toward your glutes using your hamstrings, lower slowly.'),
('Bulgarian split squat', 'Legs', '3 sets', 45, 1, NULL, 'Rear foot elevated on a bench, lower your back knee toward the floor, drive up through your front heel.'),
('Calf raise', 'Legs', '3 sets', 20, 1, NULL, 'Rise up onto your toes as high as possible, pause, lower your heels below the step for a full stretch.'),
('Hip thrust', 'Legs', '3 sets', 40, 1, NULL, 'Upper back on a bench, bar over your hips, drive your hips up until your body forms a straight line.'),
('Goblet squat', 'Legs', '3 sets', 40, 1, NULL, 'Hold a dumbbell at your chest, squat down between your knees keeping your torso upright.'),
('Step-up', 'Legs', '3 sets', 35, 1, NULL, 'Step fully onto a box with one foot, drive up until that leg is straight, step back down with control.'),
('Sumo squat', 'Legs', '3 sets', 40, 1, NULL, 'Feet wide with toes turned out, squat straight down, drive through your heels to stand.'),

('Russian twist', 'Abdomen', '3 sets', 20, 1, NULL, 'Sit with knees bent and feet slightly off the floor, rotate a weight side to side over each hip.'),
('Bicycle crunch', 'Abdomen', '3 sets', 20, 1, NULL, 'Alternate bringing elbow to opposite knee while extending the other leg, keep your core engaged throughout.'),
('Mountain climber', 'Abdomen', '3 sets (30s)', 25, 1, NULL, 'In a plank, drive your knees toward your chest alternately at a quick, controlled pace.'),
('Hanging leg raise', 'Abdomen', '3 sets', 25, 1, NULL, 'Hang from a bar, raise your legs to hip height or higher without swinging, lower with control.'),
('Cable crunch', 'Abdomen', '3 sets', 25, 1, NULL, 'Kneel below a cable, crunch down bringing your elbows toward your knees using your abs, not your arms.'),
('Side plank', 'Abdomen', '3 sets (30s/side)', 15, 1, NULL, 'Balance on one forearm and the side of your foot, hold a straight line from head to heels.'),
('V-up', 'Abdomen', '3 sets', 20, 1, NULL, 'Lying flat, simultaneously raise your legs and torso to touch your toes, forming a V shape.'),

('Rowing machine', 'Cardio', '15 minutes', 150, 1, NULL, 'Drive with your legs first, then lean back and pull the handle to your ribs, reverse the sequence to return.'),
('Stair climber', 'Cardio', '15 minutes', 160, 1, NULL, 'Keep an upright posture and steady step pace, avoid leaning heavily on the rails.'),
('Elliptical', 'Cardio', '20 minutes', 170, 1, NULL, 'Keep a smooth, steady stride, use the handles for a full-body effort if available.'),
('Burpees', 'Cardio', '3 sets (10 reps)', 40, 1, NULL, 'Squat down, kick back into a plank, do a push-up, jump feet forward, then jump up.'),
('Jumping jacks', 'Cardio', '3 sets (30s)', 20, 1, NULL, 'Jump feet out while raising arms overhead, jump back to start, keep a steady rhythm.'),
('Swimming', 'Cardio', '20 minutes', 200, 1, NULL, 'Keep a steady stroke and breathing pattern, pace yourself for continuous laps.'),
('Brisk walking', 'Cardio', '30 minutes', 140, 1, NULL, 'Walk at a pace fast enough to raise your heart rate while still able to hold a conversation.');
