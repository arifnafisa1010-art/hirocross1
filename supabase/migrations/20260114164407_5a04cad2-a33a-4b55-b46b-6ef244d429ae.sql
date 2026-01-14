-- Add more Strength (Kekuatan) test items - minimum 10 items total
-- Current: Push Up, Pull Up, Sit Up 60s, Hand Grip, Leg Press (5 items)
-- Adding: Bench Press, Squat, Back Extension, Plank, Dips (5 more items)

-- Bench Press 1RM
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Kekuatan', 'Bench Press', 'M', 13, 15, 'kg', false, 30, 45, 60, 75, 999),
('Kekuatan', 'Bench Press', 'M', 16, 19, 'kg', false, 45, 65, 85, 105, 999),
('Kekuatan', 'Bench Press', 'M', 20, 29, 'kg', false, 55, 80, 105, 130, 999),
('Kekuatan', 'Bench Press', 'M', 30, 99, 'kg', false, 50, 72, 95, 118, 999),
('Kekuatan', 'Bench Press', 'F', 13, 15, 'kg', false, 15, 25, 35, 45, 999),
('Kekuatan', 'Bench Press', 'F', 16, 19, 'kg', false, 22, 34, 46, 58, 999),
('Kekuatan', 'Bench Press', 'F', 20, 29, 'kg', false, 28, 42, 56, 70, 999),
('Kekuatan', 'Bench Press', 'F', 30, 99, 'kg', false, 24, 38, 52, 66, 999);

-- Squat 1RM
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Kekuatan', 'Squat', 'M', 13, 15, 'kg', false, 40, 60, 80, 100, 999),
('Kekuatan', 'Squat', 'M', 16, 19, 'kg', false, 60, 90, 120, 150, 999),
('Kekuatan', 'Squat', 'M', 20, 29, 'kg', false, 80, 115, 150, 185, 999),
('Kekuatan', 'Squat', 'M', 30, 99, 'kg', false, 70, 102, 135, 168, 999),
('Kekuatan', 'Squat', 'F', 13, 15, 'kg', false, 25, 40, 55, 70, 999),
('Kekuatan', 'Squat', 'F', 16, 19, 'kg', false, 38, 58, 78, 98, 999),
('Kekuatan', 'Squat', 'F', 20, 29, 'kg', false, 48, 72, 96, 120, 999),
('Kekuatan', 'Squat', 'F', 30, 99, 'kg', false, 42, 64, 86, 108, 999);

-- Back Extension (reps in 60s)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Kekuatan', 'Back Extension', 'M', 13, 15, 'reps', false, 20, 30, 40, 50, 999),
('Kekuatan', 'Back Extension', 'M', 16, 19, 'reps', false, 25, 35, 45, 55, 999),
('Kekuatan', 'Back Extension', 'M', 20, 29, 'reps', false, 30, 40, 50, 60, 999),
('Kekuatan', 'Back Extension', 'M', 30, 99, 'reps', false, 22, 32, 42, 52, 999),
('Kekuatan', 'Back Extension', 'F', 13, 15, 'reps', false, 15, 25, 35, 45, 999),
('Kekuatan', 'Back Extension', 'F', 16, 19, 'reps', false, 20, 30, 40, 50, 999),
('Kekuatan', 'Back Extension', 'F', 20, 29, 'reps', false, 25, 35, 45, 55, 999),
('Kekuatan', 'Back Extension', 'F', 30, 99, 'reps', false, 18, 28, 38, 48, 999);

-- Plank (seconds)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Kekuatan', 'Plank', 'M', 13, 15, 's', false, 30, 60, 90, 120, 999),
('Kekuatan', 'Plank', 'M', 16, 19, 's', false, 45, 75, 105, 135, 999),
('Kekuatan', 'Plank', 'M', 20, 29, 's', false, 60, 90, 120, 150, 999),
('Kekuatan', 'Plank', 'M', 30, 99, 's', false, 45, 75, 105, 135, 999),
('Kekuatan', 'Plank', 'F', 13, 15, 's', false, 25, 50, 75, 100, 999),
('Kekuatan', 'Plank', 'F', 16, 19, 's', false, 35, 60, 85, 110, 999),
('Kekuatan', 'Plank', 'F', 20, 29, 's', false, 45, 72, 99, 126, 999),
('Kekuatan', 'Plank', 'F', 30, 99, 's', false, 35, 60, 85, 110, 999);

-- Dips (reps)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Kekuatan', 'Dips', 'M', 13, 15, 'reps', false, 5, 10, 15, 20, 999),
('Kekuatan', 'Dips', 'M', 16, 19, 'reps', false, 8, 15, 22, 30, 999),
('Kekuatan', 'Dips', 'M', 20, 29, 'reps', false, 12, 20, 28, 36, 999),
('Kekuatan', 'Dips', 'M', 30, 99, 'reps', false, 8, 15, 22, 30, 999),
('Kekuatan', 'Dips', 'F', 13, 15, 'reps', false, 2, 5, 8, 12, 999),
('Kekuatan', 'Dips', 'F', 16, 19, 'reps', false, 4, 8, 12, 16, 999),
('Kekuatan', 'Dips', 'F', 20, 29, 'reps', false, 5, 10, 15, 20, 999),
('Kekuatan', 'Dips', 'F', 30, 99, 'reps', false, 3, 7, 11, 15, 999);