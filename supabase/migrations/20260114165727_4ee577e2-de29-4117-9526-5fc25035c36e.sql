-- Add new strength test items: Leg Dynamometer, Back Dynamometer, Deadlift
-- And update Bench Press, Squat to use body weight ratio (ratio = weight lifted / body weight)
-- For ratio-based tests: 1.5x BW = excellent, so we use ratio values

-- Delete old Bench Press norms (will replace with ratio-based)
DELETE FROM test_norms WHERE item IN ('Bench Press', 'Squat');

-- Add Leg Dynamometer norms (force in kg, higher is better)
INSERT INTO test_norms (category, item, unit, gender, age_min, age_max, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
-- Male
('Kekuatan', 'Leg Dynamometer', 'kg', 'M', 13, 15, false, 80, 100, 130, 160, 190),
('Kekuatan', 'Leg Dynamometer', 'kg', 'M', 16, 19, false, 100, 130, 160, 200, 240),
('Kekuatan', 'Leg Dynamometer', 'kg', 'M', 20, 29, false, 120, 160, 200, 240, 280),
('Kekuatan', 'Leg Dynamometer', 'kg', 'M', 30, 39, false, 110, 145, 180, 220, 260),
('Kekuatan', 'Leg Dynamometer', 'kg', 'M', 40, 99, false, 90, 120, 150, 190, 230),
-- Female
('Kekuatan', 'Leg Dynamometer', 'kg', 'F', 13, 15, false, 50, 70, 90, 110, 130),
('Kekuatan', 'Leg Dynamometer', 'kg', 'F', 16, 19, false, 60, 85, 110, 135, 160),
('Kekuatan', 'Leg Dynamometer', 'kg', 'F', 20, 29, false, 70, 100, 130, 160, 190),
('Kekuatan', 'Leg Dynamometer', 'kg', 'F', 30, 39, false, 65, 90, 115, 145, 175),
('Kekuatan', 'Leg Dynamometer', 'kg', 'F', 40, 99, false, 55, 75, 100, 125, 150);

-- Add Back Dynamometer norms (force in kg, higher is better)
INSERT INTO test_norms (category, item, unit, gender, age_min, age_max, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
-- Male
('Kekuatan', 'Back Dynamometer', 'kg', 'M', 13, 15, false, 60, 80, 100, 120, 140),
('Kekuatan', 'Back Dynamometer', 'kg', 'M', 16, 19, false, 80, 105, 130, 160, 190),
('Kekuatan', 'Back Dynamometer', 'kg', 'M', 20, 29, false, 100, 130, 160, 190, 220),
('Kekuatan', 'Back Dynamometer', 'kg', 'M', 30, 39, false, 90, 120, 150, 180, 210),
('Kekuatan', 'Back Dynamometer', 'kg', 'M', 40, 99, false, 70, 100, 130, 160, 190),
-- Female
('Kekuatan', 'Back Dynamometer', 'kg', 'F', 13, 15, false, 40, 55, 70, 85, 100),
('Kekuatan', 'Back Dynamometer', 'kg', 'F', 16, 19, false, 50, 70, 90, 110, 130),
('Kekuatan', 'Back Dynamometer', 'kg', 'F', 20, 29, false, 60, 85, 110, 135, 160),
('Kekuatan', 'Back Dynamometer', 'kg', 'F', 30, 39, false, 55, 75, 100, 125, 150),
('Kekuatan', 'Back Dynamometer', 'kg', 'F', 40, 99, false, 45, 65, 85, 105, 130);

-- Add Bench Press ratio-based norms (ratio = lifted weight / body weight)
-- Score 5: >1.5x BW (male), >1.0x BW (female) = elite
INSERT INTO test_norms (category, item, unit, gender, age_min, age_max, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
-- Male (ratio values)
('Kekuatan', 'Bench Press', 'xBW', 'M', 13, 15, false, 0.3, 0.5, 0.7, 0.9, 1.1),
('Kekuatan', 'Bench Press', 'xBW', 'M', 16, 19, false, 0.5, 0.7, 1.0, 1.2, 1.5),
('Kekuatan', 'Bench Press', 'xBW', 'M', 20, 29, false, 0.6, 0.8, 1.1, 1.4, 1.7),
('Kekuatan', 'Bench Press', 'xBW', 'M', 30, 39, false, 0.5, 0.75, 1.0, 1.25, 1.5),
('Kekuatan', 'Bench Press', 'xBW', 'M', 40, 99, false, 0.4, 0.6, 0.85, 1.1, 1.35),
-- Female (ratio values)
('Kekuatan', 'Bench Press', 'xBW', 'F', 13, 15, false, 0.2, 0.35, 0.5, 0.65, 0.8),
('Kekuatan', 'Bench Press', 'xBW', 'F', 16, 19, false, 0.3, 0.45, 0.6, 0.8, 1.0),
('Kekuatan', 'Bench Press', 'xBW', 'F', 20, 29, false, 0.35, 0.5, 0.7, 0.9, 1.1),
('Kekuatan', 'Bench Press', 'xBW', 'F', 30, 39, false, 0.3, 0.45, 0.6, 0.8, 1.0),
('Kekuatan', 'Bench Press', 'xBW', 'F', 40, 99, false, 0.25, 0.4, 0.55, 0.7, 0.9);

-- Add Squat ratio-based norms (ratio = lifted weight / body weight)
INSERT INTO test_norms (category, item, unit, gender, age_min, age_max, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
-- Male (ratio values)
('Kekuatan', 'Squat', 'xBW', 'M', 13, 15, false, 0.5, 0.7, 1.0, 1.2, 1.5),
('Kekuatan', 'Squat', 'xBW', 'M', 16, 19, false, 0.7, 1.0, 1.3, 1.6, 2.0),
('Kekuatan', 'Squat', 'xBW', 'M', 20, 29, false, 0.8, 1.2, 1.5, 1.9, 2.3),
('Kekuatan', 'Squat', 'xBW', 'M', 30, 39, false, 0.7, 1.0, 1.3, 1.7, 2.1),
('Kekuatan', 'Squat', 'xBW', 'M', 40, 99, false, 0.6, 0.9, 1.2, 1.5, 1.9),
-- Female (ratio values)
('Kekuatan', 'Squat', 'xBW', 'F', 13, 15, false, 0.4, 0.55, 0.75, 0.95, 1.15),
('Kekuatan', 'Squat', 'xBW', 'F', 16, 19, false, 0.5, 0.7, 0.95, 1.2, 1.5),
('Kekuatan', 'Squat', 'xBW', 'F', 20, 29, false, 0.6, 0.85, 1.1, 1.4, 1.7),
('Kekuatan', 'Squat', 'xBW', 'F', 30, 39, false, 0.5, 0.75, 1.0, 1.25, 1.5),
('Kekuatan', 'Squat', 'xBW', 'F', 40, 99, false, 0.45, 0.65, 0.9, 1.15, 1.4);

-- Add Deadlift ratio-based norms (ratio = lifted weight / body weight)
INSERT INTO test_norms (category, item, unit, gender, age_min, age_max, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
-- Male (ratio values)
('Kekuatan', 'Deadlift', 'xBW', 'M', 13, 15, false, 0.6, 0.9, 1.2, 1.5, 1.8),
('Kekuatan', 'Deadlift', 'xBW', 'M', 16, 19, false, 0.8, 1.2, 1.6, 2.0, 2.5),
('Kekuatan', 'Deadlift', 'xBW', 'M', 20, 29, false, 1.0, 1.5, 2.0, 2.5, 3.0),
('Kekuatan', 'Deadlift', 'xBW', 'M', 30, 39, false, 0.9, 1.3, 1.8, 2.3, 2.8),
('Kekuatan', 'Deadlift', 'xBW', 'M', 40, 99, false, 0.7, 1.1, 1.5, 2.0, 2.5),
-- Female (ratio values)
('Kekuatan', 'Deadlift', 'xBW', 'F', 13, 15, false, 0.5, 0.7, 1.0, 1.2, 1.5),
('Kekuatan', 'Deadlift', 'xBW', 'F', 16, 19, false, 0.6, 0.9, 1.2, 1.5, 1.8),
('Kekuatan', 'Deadlift', 'xBW', 'F', 20, 29, false, 0.7, 1.0, 1.4, 1.8, 2.2),
('Kekuatan', 'Deadlift', 'xBW', 'F', 30, 39, false, 0.6, 0.9, 1.2, 1.6, 2.0),
('Kekuatan', 'Deadlift', 'xBW', 'F', 40, 99, false, 0.5, 0.8, 1.1, 1.4, 1.8);

-- Fix Leg Press to have consistent age ranges (add missing age groups)
DELETE FROM test_norms WHERE item = 'Leg Press';
INSERT INTO test_norms (category, item, unit, gender, age_min, age_max, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
-- Male
('Kekuatan', 'Leg Press', 'kg', 'M', 13, 15, false, 60, 90, 120, 150, 180),
('Kekuatan', 'Leg Press', 'kg', 'M', 16, 19, false, 80, 120, 160, 200, 250),
('Kekuatan', 'Leg Press', 'kg', 'M', 20, 29, false, 100, 150, 200, 260, 320),
('Kekuatan', 'Leg Press', 'kg', 'M', 30, 39, false, 90, 140, 190, 240, 300),
('Kekuatan', 'Leg Press', 'kg', 'M', 40, 99, false, 70, 110, 160, 210, 260),
-- Female
('Kekuatan', 'Leg Press', 'kg', 'F', 13, 15, false, 40, 60, 80, 100, 120),
('Kekuatan', 'Leg Press', 'kg', 'F', 16, 19, false, 50, 80, 110, 140, 170),
('Kekuatan', 'Leg Press', 'kg', 'F', 20, 29, false, 60, 100, 140, 180, 220),
('Kekuatan', 'Leg Press', 'kg', 'F', 30, 39, false, 55, 90, 125, 160, 200),
('Kekuatan', 'Leg Press', 'kg', 'F', 40, 99, false, 45, 75, 105, 140, 175);