-- Insert comprehensive test norms for all biomotor categories
-- Based on age groups and gender

-- Clear existing norms first
DELETE FROM test_norms;

-- STRENGTH TESTS (10 items)
-- 1. Bench Press 1RM (kg)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Strength', 'Bench Press 1RM', 'M', 13, 15, 'kg', false, 30, 40, 50, 60, 70),
('Strength', 'Bench Press 1RM', 'M', 16, 18, 'kg', false, 40, 55, 70, 85, 100),
('Strength', 'Bench Press 1RM', 'M', 19, 25, 'kg', false, 50, 65, 80, 95, 110),
('Strength', 'Bench Press 1RM', 'M', 26, 35, 'kg', false, 50, 65, 80, 95, 110),
('Strength', 'Bench Press 1RM', 'M', 36, 99, 'kg', false, 45, 55, 70, 85, 100),
('Strength', 'Bench Press 1RM', 'F', 13, 15, 'kg', false, 15, 20, 25, 30, 40),
('Strength', 'Bench Press 1RM', 'F', 16, 18, 'kg', false, 20, 25, 35, 45, 55),
('Strength', 'Bench Press 1RM', 'F', 19, 25, 'kg', false, 25, 35, 45, 55, 65),
('Strength', 'Bench Press 1RM', 'F', 26, 35, 'kg', false, 25, 35, 45, 55, 65),
('Strength', 'Bench Press 1RM', 'F', 36, 99, 'kg', false, 20, 30, 40, 50, 60);

-- 2. Squat 1RM (kg)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Strength', 'Squat 1RM', 'M', 13, 15, 'kg', false, 40, 55, 70, 85, 100),
('Strength', 'Squat 1RM', 'M', 16, 18, 'kg', false, 60, 80, 100, 120, 140),
('Strength', 'Squat 1RM', 'M', 19, 25, 'kg', false, 80, 100, 120, 140, 160),
('Strength', 'Squat 1RM', 'M', 26, 35, 'kg', false, 80, 100, 120, 140, 160),
('Strength', 'Squat 1RM', 'M', 36, 99, 'kg', false, 70, 90, 110, 130, 150),
('Strength', 'Squat 1RM', 'F', 13, 15, 'kg', false, 25, 35, 45, 55, 70),
('Strength', 'Squat 1RM', 'F', 16, 18, 'kg', false, 35, 50, 65, 80, 95),
('Strength', 'Squat 1RM', 'F', 19, 25, 'kg', false, 45, 60, 80, 100, 120),
('Strength', 'Squat 1RM', 'F', 26, 35, 'kg', false, 45, 60, 80, 100, 120),
('Strength', 'Squat 1RM', 'F', 36, 99, 'kg', false, 40, 55, 70, 85, 100);

-- 3. Deadlift 1RM (kg)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Strength', 'Deadlift 1RM', 'M', 13, 15, 'kg', false, 50, 65, 80, 95, 110),
('Strength', 'Deadlift 1RM', 'M', 16, 18, 'kg', false, 70, 95, 120, 145, 170),
('Strength', 'Deadlift 1RM', 'M', 19, 25, 'kg', false, 100, 125, 150, 175, 200),
('Strength', 'Deadlift 1RM', 'M', 26, 35, 'kg', false, 100, 125, 150, 175, 200),
('Strength', 'Deadlift 1RM', 'M', 36, 99, 'kg', false, 90, 115, 140, 165, 190),
('Strength', 'Deadlift 1RM', 'F', 13, 15, 'kg', false, 30, 40, 55, 70, 85),
('Strength', 'Deadlift 1RM', 'F', 16, 18, 'kg', false, 45, 60, 80, 100, 120),
('Strength', 'Deadlift 1RM', 'F', 19, 25, 'kg', false, 55, 75, 95, 115, 135),
('Strength', 'Deadlift 1RM', 'F', 26, 35, 'kg', false, 55, 75, 95, 115, 135),
('Strength', 'Deadlift 1RM', 'F', 36, 99, 'kg', false, 50, 65, 85, 105, 125);

-- 4. Push Up (reps)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Strength', 'Push Up', 'M', 13, 15, 'reps', false, 10, 20, 30, 40, 50),
('Strength', 'Push Up', 'M', 16, 18, 'reps', false, 15, 25, 35, 45, 55),
('Strength', 'Push Up', 'M', 19, 25, 'reps', false, 20, 30, 45, 55, 65),
('Strength', 'Push Up', 'M', 26, 35, 'reps', false, 17, 27, 40, 50, 60),
('Strength', 'Push Up', 'M', 36, 99, 'reps', false, 12, 22, 32, 42, 52),
('Strength', 'Push Up', 'F', 13, 15, 'reps', false, 5, 10, 15, 25, 35),
('Strength', 'Push Up', 'F', 16, 18, 'reps', false, 8, 15, 22, 30, 40),
('Strength', 'Push Up', 'F', 19, 25, 'reps', false, 10, 18, 27, 35, 45),
('Strength', 'Push Up', 'F', 26, 35, 'reps', false, 8, 16, 24, 32, 42),
('Strength', 'Push Up', 'F', 36, 99, 'reps', false, 5, 12, 20, 28, 38);

-- 5. Pull Up (reps)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Strength', 'Pull Up', 'M', 13, 15, 'reps', false, 2, 5, 8, 12, 16),
('Strength', 'Pull Up', 'M', 16, 18, 'reps', false, 4, 8, 12, 16, 20),
('Strength', 'Pull Up', 'M', 19, 25, 'reps', false, 6, 10, 14, 18, 24),
('Strength', 'Pull Up', 'M', 26, 35, 'reps', false, 5, 9, 13, 17, 22),
('Strength', 'Pull Up', 'M', 36, 99, 'reps', false, 3, 7, 11, 15, 20),
('Strength', 'Pull Up', 'F', 13, 15, 'reps', false, 0, 1, 3, 5, 8),
('Strength', 'Pull Up', 'F', 16, 18, 'reps', false, 1, 2, 4, 7, 10),
('Strength', 'Pull Up', 'F', 19, 25, 'reps', false, 1, 3, 5, 8, 12),
('Strength', 'Pull Up', 'F', 26, 35, 'reps', false, 1, 2, 4, 7, 11),
('Strength', 'Pull Up', 'F', 36, 99, 'reps', false, 0, 1, 3, 6, 10);

-- 6. Leg Dynamometer (kg)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Strength', 'Leg Dynamometer', 'M', 13, 15, 'kg', false, 80, 110, 140, 170, 200),
('Strength', 'Leg Dynamometer', 'M', 16, 18, 'kg', false, 120, 160, 200, 240, 280),
('Strength', 'Leg Dynamometer', 'M', 19, 25, 'kg', false, 150, 190, 230, 270, 310),
('Strength', 'Leg Dynamometer', 'M', 26, 35, 'kg', false, 150, 190, 230, 270, 310),
('Strength', 'Leg Dynamometer', 'M', 36, 99, 'kg', false, 130, 170, 210, 250, 290),
('Strength', 'Leg Dynamometer', 'F', 13, 15, 'kg', false, 50, 70, 90, 115, 140),
('Strength', 'Leg Dynamometer', 'F', 16, 18, 'kg', false, 70, 95, 120, 145, 170),
('Strength', 'Leg Dynamometer', 'F', 19, 25, 'kg', false, 90, 115, 145, 175, 205),
('Strength', 'Leg Dynamometer', 'F', 26, 35, 'kg', false, 90, 115, 145, 175, 205),
('Strength', 'Leg Dynamometer', 'F', 36, 99, 'kg', false, 80, 105, 130, 160, 190);

-- 7. Back Dynamometer (kg)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Strength', 'Back Dynamometer', 'M', 13, 15, 'kg', false, 60, 80, 100, 120, 145),
('Strength', 'Back Dynamometer', 'M', 16, 18, 'kg', false, 90, 115, 140, 165, 190),
('Strength', 'Back Dynamometer', 'M', 19, 25, 'kg', false, 110, 135, 165, 195, 225),
('Strength', 'Back Dynamometer', 'M', 26, 35, 'kg', false, 110, 135, 165, 195, 225),
('Strength', 'Back Dynamometer', 'M', 36, 99, 'kg', false, 100, 125, 150, 180, 210),
('Strength', 'Back Dynamometer', 'F', 13, 15, 'kg', false, 35, 50, 65, 85, 105),
('Strength', 'Back Dynamometer', 'F', 16, 18, 'kg', false, 50, 70, 90, 110, 130),
('Strength', 'Back Dynamometer', 'F', 19, 25, 'kg', false, 60, 80, 105, 130, 155),
('Strength', 'Back Dynamometer', 'F', 26, 35, 'kg', false, 60, 80, 105, 130, 155),
('Strength', 'Back Dynamometer', 'F', 36, 99, 'kg', false, 55, 75, 95, 120, 145);

-- 8. Hand Grip Right (kg)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Strength', 'Hand Grip Right', 'M', 13, 15, 'kg', false, 25, 32, 40, 48, 56),
('Strength', 'Hand Grip Right', 'M', 16, 18, 'kg', false, 35, 43, 52, 61, 70),
('Strength', 'Hand Grip Right', 'M', 19, 25, 'kg', false, 42, 50, 58, 67, 76),
('Strength', 'Hand Grip Right', 'M', 26, 35, 'kg', false, 43, 51, 59, 68, 77),
('Strength', 'Hand Grip Right', 'M', 36, 99, 'kg', false, 40, 48, 56, 64, 73),
('Strength', 'Hand Grip Right', 'F', 13, 15, 'kg', false, 18, 23, 28, 34, 40),
('Strength', 'Hand Grip Right', 'F', 16, 18, 'kg', false, 22, 27, 33, 39, 45),
('Strength', 'Hand Grip Right', 'F', 19, 25, 'kg', false, 25, 30, 36, 42, 48),
('Strength', 'Hand Grip Right', 'F', 26, 35, 'kg', false, 26, 31, 37, 43, 49),
('Strength', 'Hand Grip Right', 'F', 36, 99, 'kg', false, 24, 29, 35, 41, 47);

-- 9. Hand Grip Left (kg)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Strength', 'Hand Grip Left', 'M', 13, 15, 'kg', false, 23, 30, 38, 46, 54),
('Strength', 'Hand Grip Left', 'M', 16, 18, 'kg', false, 33, 41, 50, 59, 68),
('Strength', 'Hand Grip Left', 'M', 19, 25, 'kg', false, 40, 48, 56, 65, 74),
('Strength', 'Hand Grip Left', 'M', 26, 35, 'kg', false, 41, 49, 57, 66, 75),
('Strength', 'Hand Grip Left', 'M', 36, 99, 'kg', false, 38, 46, 54, 62, 71),
('Strength', 'Hand Grip Left', 'F', 13, 15, 'kg', false, 16, 21, 26, 32, 38),
('Strength', 'Hand Grip Left', 'F', 16, 18, 'kg', false, 20, 25, 31, 37, 43),
('Strength', 'Hand Grip Left', 'F', 19, 25, 'kg', false, 23, 28, 34, 40, 46),
('Strength', 'Hand Grip Left', 'F', 26, 35, 'kg', false, 24, 29, 35, 41, 47),
('Strength', 'Hand Grip Left', 'F', 36, 99, 'kg', false, 22, 27, 33, 39, 45);

-- 10. Sit Up (reps/60s)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Strength', 'Sit Up 60s', 'M', 13, 15, 'reps', false, 20, 30, 40, 50, 60),
('Strength', 'Sit Up 60s', 'M', 16, 18, 'reps', false, 25, 35, 45, 55, 65),
('Strength', 'Sit Up 60s', 'M', 19, 25, 'reps', false, 30, 40, 50, 60, 70),
('Strength', 'Sit Up 60s', 'M', 26, 35, 'reps', false, 28, 38, 48, 58, 68),
('Strength', 'Sit Up 60s', 'M', 36, 99, 'reps', false, 22, 32, 42, 52, 62),
('Strength', 'Sit Up 60s', 'F', 13, 15, 'reps', false, 15, 22, 30, 40, 50),
('Strength', 'Sit Up 60s', 'F', 16, 18, 'reps', false, 18, 26, 35, 45, 55),
('Strength', 'Sit Up 60s', 'F', 19, 25, 'reps', false, 22, 30, 40, 50, 60),
('Strength', 'Sit Up 60s', 'F', 26, 35, 'reps', false, 20, 28, 38, 48, 58),
('Strength', 'Sit Up 60s', 'F', 36, 99, 'reps', false, 16, 24, 34, 44, 54);

-- SPEED TESTS (5 items)
-- 1. Sprint 30m (seconds)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Speed', 'Sprint 30m', 'M', 13, 15, 's', true, 5.8, 5.2, 4.7, 4.3, 4.0),
('Speed', 'Sprint 30m', 'M', 16, 18, 's', true, 5.2, 4.7, 4.3, 4.0, 3.8),
('Speed', 'Sprint 30m', 'M', 19, 25, 's', true, 4.8, 4.4, 4.1, 3.8, 3.6),
('Speed', 'Sprint 30m', 'M', 26, 35, 's', true, 4.9, 4.5, 4.2, 3.9, 3.7),
('Speed', 'Sprint 30m', 'M', 36, 99, 's', true, 5.2, 4.8, 4.4, 4.1, 3.9),
('Speed', 'Sprint 30m', 'F', 13, 15, 's', true, 6.5, 5.9, 5.4, 5.0, 4.6),
('Speed', 'Sprint 30m', 'F', 16, 18, 's', true, 6.0, 5.5, 5.0, 4.6, 4.3),
('Speed', 'Sprint 30m', 'F', 19, 25, 's', true, 5.6, 5.1, 4.7, 4.4, 4.1),
('Speed', 'Sprint 30m', 'F', 26, 35, 's', true, 5.8, 5.3, 4.9, 4.5, 4.2),
('Speed', 'Sprint 30m', 'F', 36, 99, 's', true, 6.2, 5.6, 5.2, 4.8, 4.5);

-- 2. Sprint 60m (seconds)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Speed', 'Sprint 60m', 'M', 13, 15, 's', true, 10.0, 9.0, 8.2, 7.6, 7.2),
('Speed', 'Sprint 60m', 'M', 16, 18, 's', true, 9.0, 8.2, 7.5, 7.0, 6.6),
('Speed', 'Sprint 60m', 'M', 19, 25, 's', true, 8.4, 7.7, 7.1, 6.7, 6.4),
('Speed', 'Sprint 60m', 'M', 26, 35, 's', true, 8.6, 7.9, 7.3, 6.9, 6.5),
('Speed', 'Sprint 60m', 'M', 36, 99, 's', true, 9.2, 8.4, 7.8, 7.3, 6.9),
('Speed', 'Sprint 60m', 'F', 13, 15, 's', true, 11.5, 10.5, 9.6, 8.9, 8.3),
('Speed', 'Sprint 60m', 'F', 16, 18, 's', true, 10.5, 9.7, 8.9, 8.3, 7.8),
('Speed', 'Sprint 60m', 'F', 19, 25, 's', true, 10.0, 9.2, 8.5, 7.9, 7.4),
('Speed', 'Sprint 60m', 'F', 26, 35, 's', true, 10.3, 9.5, 8.8, 8.2, 7.7),
('Speed', 'Sprint 60m', 'F', 36, 99, 's', true, 11.0, 10.1, 9.3, 8.7, 8.2);

-- 3. Sprint 100m (seconds)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Speed', 'Sprint 100m', 'M', 13, 15, 's', true, 16.5, 15.0, 13.8, 12.8, 12.0),
('Speed', 'Sprint 100m', 'M', 16, 18, 's', true, 14.5, 13.5, 12.5, 11.8, 11.2),
('Speed', 'Sprint 100m', 'M', 19, 25, 's', true, 13.5, 12.5, 11.7, 11.1, 10.6),
('Speed', 'Sprint 100m', 'M', 26, 35, 's', true, 13.8, 12.8, 12.0, 11.4, 10.9),
('Speed', 'Sprint 100m', 'M', 36, 99, 's', true, 14.5, 13.5, 12.6, 12.0, 11.5),
('Speed', 'Sprint 100m', 'F', 13, 15, 's', true, 18.5, 17.0, 15.8, 14.8, 14.0),
('Speed', 'Sprint 100m', 'F', 16, 18, 's', true, 17.0, 15.8, 14.8, 14.0, 13.3),
('Speed', 'Sprint 100m', 'F', 19, 25, 's', true, 16.0, 14.8, 14.0, 13.2, 12.6),
('Speed', 'Sprint 100m', 'F', 26, 35, 's', true, 16.5, 15.3, 14.4, 13.6, 13.0),
('Speed', 'Sprint 100m', 'F', 36, 99, 's', true, 17.5, 16.2, 15.2, 14.4, 13.8);

-- 4. Agility T-Test (seconds)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Speed', 'Agility T-Test', 'M', 13, 15, 's', true, 13.5, 12.0, 10.8, 9.8, 9.0),
('Speed', 'Agility T-Test', 'M', 16, 18, 's', true, 12.0, 10.8, 9.8, 9.0, 8.5),
('Speed', 'Agility T-Test', 'M', 19, 25, 's', true, 11.0, 10.0, 9.2, 8.6, 8.2),
('Speed', 'Agility T-Test', 'M', 26, 35, 's', true, 11.3, 10.3, 9.4, 8.8, 8.4),
('Speed', 'Agility T-Test', 'M', 36, 99, 's', true, 12.0, 10.9, 9.9, 9.2, 8.8),
('Speed', 'Agility T-Test', 'F', 13, 15, 's', true, 14.5, 13.0, 11.8, 10.8, 10.0),
('Speed', 'Agility T-Test', 'F', 16, 18, 's', true, 13.5, 12.2, 11.2, 10.4, 9.7),
('Speed', 'Agility T-Test', 'F', 19, 25, 's', true, 12.5, 11.5, 10.6, 9.9, 9.4),
('Speed', 'Agility T-Test', 'F', 26, 35, 's', true, 12.8, 11.8, 10.9, 10.2, 9.6),
('Speed', 'Agility T-Test', 'F', 36, 99, 's', true, 13.5, 12.4, 11.4, 10.6, 10.0);

-- 5. Illinois Agility Run (seconds)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Speed', 'Illinois Agility', 'M', 13, 15, 's', true, 20.0, 18.0, 16.5, 15.3, 14.5),
('Speed', 'Illinois Agility', 'M', 16, 18, 's', true, 18.5, 16.8, 15.5, 14.5, 13.8),
('Speed', 'Illinois Agility', 'M', 19, 25, 's', true, 17.5, 16.0, 14.9, 14.0, 13.3),
('Speed', 'Illinois Agility', 'M', 26, 35, 's', true, 17.8, 16.3, 15.2, 14.3, 13.6),
('Speed', 'Illinois Agility', 'M', 36, 99, 's', true, 18.5, 17.0, 15.8, 14.9, 14.2),
('Speed', 'Illinois Agility', 'F', 13, 15, 's', true, 22.0, 20.0, 18.5, 17.2, 16.2),
('Speed', 'Illinois Agility', 'F', 16, 18, 's', true, 20.5, 18.8, 17.5, 16.5, 15.7),
('Speed', 'Illinois Agility', 'F', 19, 25, 's', true, 19.5, 18.0, 16.8, 15.8, 15.1),
('Speed', 'Illinois Agility', 'F', 26, 35, 's', true, 20.0, 18.4, 17.2, 16.2, 15.4),
('Speed', 'Illinois Agility', 'F', 36, 99, 's', true, 21.0, 19.2, 17.9, 16.8, 16.0);

-- ENDURANCE TESTS (5 items)
-- 1. Cooper Test 12 min (meters)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Endurance', 'Cooper Test 12min', 'M', 13, 15, 'm', false, 1800, 2100, 2400, 2700, 3000),
('Endurance', 'Cooper Test 12min', 'M', 16, 18, 'm', false, 2000, 2300, 2600, 2900, 3200),
('Endurance', 'Cooper Test 12min', 'M', 19, 25, 'm', false, 2200, 2500, 2800, 3100, 3400),
('Endurance', 'Cooper Test 12min', 'M', 26, 35, 'm', false, 2100, 2400, 2700, 3000, 3300),
('Endurance', 'Cooper Test 12min', 'M', 36, 99, 'm', false, 1900, 2200, 2500, 2800, 3100),
('Endurance', 'Cooper Test 12min', 'F', 13, 15, 'm', false, 1400, 1700, 2000, 2300, 2600),
('Endurance', 'Cooper Test 12min', 'F', 16, 18, 'm', false, 1600, 1900, 2200, 2500, 2800),
('Endurance', 'Cooper Test 12min', 'F', 19, 25, 'm', false, 1800, 2100, 2400, 2700, 3000),
('Endurance', 'Cooper Test 12min', 'F', 26, 35, 'm', false, 1700, 2000, 2300, 2600, 2900),
('Endurance', 'Cooper Test 12min', 'F', 36, 99, 'm', false, 1500, 1800, 2100, 2400, 2700);

-- 2. Bleep Test / Yo-Yo (level)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Endurance', 'Bleep Test', 'M', 13, 15, 'level', false, 4, 6, 8, 10, 12),
('Endurance', 'Bleep Test', 'M', 16, 18, 'level', false, 5, 7, 9, 11, 13),
('Endurance', 'Bleep Test', 'M', 19, 25, 'level', false, 6, 8, 10, 12, 14),
('Endurance', 'Bleep Test', 'M', 26, 35, 'level', false, 5, 7, 9, 11, 13),
('Endurance', 'Bleep Test', 'M', 36, 99, 'level', false, 4, 6, 8, 10, 12),
('Endurance', 'Bleep Test', 'F', 13, 15, 'level', false, 3, 4, 6, 8, 10),
('Endurance', 'Bleep Test', 'F', 16, 18, 'level', false, 4, 5, 7, 9, 11),
('Endurance', 'Bleep Test', 'F', 19, 25, 'level', false, 4, 6, 8, 10, 12),
('Endurance', 'Bleep Test', 'F', 26, 35, 'level', false, 4, 5, 7, 9, 11),
('Endurance', 'Bleep Test', 'F', 36, 99, 'level', false, 3, 4, 6, 8, 10);

-- 3. VO2 Max Estimate (ml/kg/min)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Endurance', 'VO2 Max', 'M', 13, 15, 'ml/kg/min', false, 30, 38, 45, 52, 58),
('Endurance', 'VO2 Max', 'M', 16, 18, 'ml/kg/min', false, 35, 42, 50, 57, 64),
('Endurance', 'VO2 Max', 'M', 19, 25, 'ml/kg/min', false, 38, 45, 52, 59, 66),
('Endurance', 'VO2 Max', 'M', 26, 35, 'ml/kg/min', false, 36, 43, 50, 56, 63),
('Endurance', 'VO2 Max', 'M', 36, 99, 'ml/kg/min', false, 32, 40, 47, 54, 60),
('Endurance', 'VO2 Max', 'F', 13, 15, 'ml/kg/min', false, 26, 32, 38, 44, 50),
('Endurance', 'VO2 Max', 'F', 16, 18, 'ml/kg/min', false, 28, 35, 42, 48, 54),
('Endurance', 'VO2 Max', 'F', 19, 25, 'ml/kg/min', false, 30, 37, 44, 50, 56),
('Endurance', 'VO2 Max', 'F', 26, 35, 'ml/kg/min', false, 28, 35, 42, 48, 54),
('Endurance', 'VO2 Max', 'F', 36, 99, 'ml/kg/min', false, 26, 33, 40, 46, 52);

-- 4. 1600m Run (minutes)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Endurance', 'Run 1600m', 'M', 13, 15, 'min', true, 10.0, 8.5, 7.5, 6.5, 5.8),
('Endurance', 'Run 1600m', 'M', 16, 18, 'min', true, 9.0, 7.8, 6.8, 6.0, 5.4),
('Endurance', 'Run 1600m', 'M', 19, 25, 'min', true, 8.5, 7.3, 6.4, 5.6, 5.0),
('Endurance', 'Run 1600m', 'M', 26, 35, 'min', true, 8.8, 7.6, 6.6, 5.8, 5.2),
('Endurance', 'Run 1600m', 'M', 36, 99, 'min', true, 9.5, 8.2, 7.2, 6.3, 5.7),
('Endurance', 'Run 1600m', 'F', 13, 15, 'min', true, 12.0, 10.5, 9.3, 8.3, 7.5),
('Endurance', 'Run 1600m', 'F', 16, 18, 'min', true, 11.0, 9.8, 8.8, 7.8, 7.0),
('Endurance', 'Run 1600m', 'F', 19, 25, 'min', true, 10.5, 9.3, 8.3, 7.4, 6.7),
('Endurance', 'Run 1600m', 'F', 26, 35, 'min', true, 10.8, 9.6, 8.6, 7.7, 7.0),
('Endurance', 'Run 1600m', 'F', 36, 99, 'min', true, 11.5, 10.2, 9.1, 8.2, 7.5);

-- 5. Harvard Step Test (index)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Endurance', 'Harvard Step Test', 'M', 13, 15, 'index', false, 50, 60, 70, 80, 90),
('Endurance', 'Harvard Step Test', 'M', 16, 18, 'index', false, 55, 65, 75, 85, 95),
('Endurance', 'Harvard Step Test', 'M', 19, 25, 'index', false, 60, 70, 80, 90, 100),
('Endurance', 'Harvard Step Test', 'M', 26, 35, 'index', false, 55, 65, 75, 85, 95),
('Endurance', 'Harvard Step Test', 'M', 36, 99, 'index', false, 50, 60, 70, 80, 90),
('Endurance', 'Harvard Step Test', 'F', 13, 15, 'index', false, 45, 55, 65, 75, 85),
('Endurance', 'Harvard Step Test', 'F', 16, 18, 'index', false, 50, 60, 70, 80, 90),
('Endurance', 'Harvard Step Test', 'F', 19, 25, 'index', false, 55, 65, 75, 85, 95),
('Endurance', 'Harvard Step Test', 'F', 26, 35, 'index', false, 50, 60, 70, 80, 90),
('Endurance', 'Harvard Step Test', 'F', 36, 99, 'index', false, 45, 55, 65, 75, 85);

-- TECHNIQUE TESTS (5 items) - Sport Specific
-- 1. Vertical Jump (cm)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Technique', 'Vertical Jump', 'M', 13, 15, 'cm', false, 30, 38, 46, 54, 62),
('Technique', 'Vertical Jump', 'M', 16, 18, 'cm', false, 40, 48, 56, 64, 72),
('Technique', 'Vertical Jump', 'M', 19, 25, 'cm', false, 45, 53, 61, 69, 77),
('Technique', 'Vertical Jump', 'M', 26, 35, 'cm', false, 43, 51, 59, 67, 75),
('Technique', 'Vertical Jump', 'M', 36, 99, 'cm', false, 38, 46, 54, 62, 70),
('Technique', 'Vertical Jump', 'F', 13, 15, 'cm', false, 22, 28, 34, 40, 48),
('Technique', 'Vertical Jump', 'F', 16, 18, 'cm', false, 28, 34, 40, 48, 55),
('Technique', 'Vertical Jump', 'F', 19, 25, 'cm', false, 32, 38, 45, 52, 60),
('Technique', 'Vertical Jump', 'F', 26, 35, 'cm', false, 30, 36, 43, 50, 58),
('Technique', 'Vertical Jump', 'F', 36, 99, 'cm', false, 26, 32, 39, 46, 54);

-- 2. Standing Long Jump (cm)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Technique', 'Standing Long Jump', 'M', 13, 15, 'cm', false, 160, 185, 210, 235, 260),
('Technique', 'Standing Long Jump', 'M', 16, 18, 'cm', false, 190, 215, 240, 265, 290),
('Technique', 'Standing Long Jump', 'M', 19, 25, 'cm', false, 210, 235, 260, 285, 310),
('Technique', 'Standing Long Jump', 'M', 26, 35, 'cm', false, 200, 225, 250, 275, 300),
('Technique', 'Standing Long Jump', 'M', 36, 99, 'cm', false, 180, 205, 230, 255, 280),
('Technique', 'Standing Long Jump', 'F', 13, 15, 'cm', false, 130, 150, 170, 190, 215),
('Technique', 'Standing Long Jump', 'F', 16, 18, 'cm', false, 150, 170, 190, 210, 235),
('Technique', 'Standing Long Jump', 'F', 19, 25, 'cm', false, 165, 185, 205, 225, 250),
('Technique', 'Standing Long Jump', 'F', 26, 35, 'cm', false, 155, 175, 195, 215, 240),
('Technique', 'Standing Long Jump', 'F', 36, 99, 'cm', false, 140, 160, 180, 200, 225);

-- 3. Medicine Ball Throw (m)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Technique', 'Medicine Ball Throw', 'M', 13, 15, 'm', false, 4.0, 5.5, 7.0, 8.5, 10.0),
('Technique', 'Medicine Ball Throw', 'M', 16, 18, 'm', false, 5.5, 7.0, 8.5, 10.0, 12.0),
('Technique', 'Medicine Ball Throw', 'M', 19, 25, 'm', false, 6.5, 8.0, 9.5, 11.0, 13.0),
('Technique', 'Medicine Ball Throw', 'M', 26, 35, 'm', false, 6.0, 7.5, 9.0, 10.5, 12.5),
('Technique', 'Medicine Ball Throw', 'M', 36, 99, 'm', false, 5.0, 6.5, 8.0, 9.5, 11.5),
('Technique', 'Medicine Ball Throw', 'F', 13, 15, 'm', false, 2.5, 3.5, 4.5, 5.5, 7.0),
('Technique', 'Medicine Ball Throw', 'F', 16, 18, 'm', false, 3.5, 4.5, 5.5, 6.5, 8.0),
('Technique', 'Medicine Ball Throw', 'F', 19, 25, 'm', false, 4.0, 5.0, 6.0, 7.0, 8.5),
('Technique', 'Medicine Ball Throw', 'F', 26, 35, 'm', false, 3.5, 4.5, 5.5, 6.5, 8.0),
('Technique', 'Medicine Ball Throw', 'F', 36, 99, 'm', false, 3.0, 4.0, 5.0, 6.0, 7.5);

-- 4. Balance Test (seconds)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Technique', 'Balance Test', 'M', 13, 15, 's', false, 15, 25, 40, 55, 70),
('Technique', 'Balance Test', 'M', 16, 18, 's', false, 20, 35, 50, 65, 85),
('Technique', 'Balance Test', 'M', 19, 25, 's', false, 25, 40, 55, 75, 95),
('Technique', 'Balance Test', 'M', 26, 35, 's', false, 25, 40, 55, 75, 95),
('Technique', 'Balance Test', 'M', 36, 99, 's', false, 20, 35, 50, 65, 85),
('Technique', 'Balance Test', 'F', 13, 15, 's', false, 18, 30, 45, 60, 80),
('Technique', 'Balance Test', 'F', 16, 18, 's', false, 22, 38, 53, 70, 90),
('Technique', 'Balance Test', 'F', 19, 25, 's', false, 28, 43, 60, 80, 100),
('Technique', 'Balance Test', 'F', 26, 35, 's', false, 28, 43, 60, 80, 100),
('Technique', 'Balance Test', 'F', 36, 99, 's', false, 22, 38, 53, 70, 90);

-- 5. Coordination Test - Hexagon (seconds)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Technique', 'Hexagon Test', 'M', 13, 15, 's', true, 18.0, 15.0, 13.0, 11.5, 10.0),
('Technique', 'Hexagon Test', 'M', 16, 18, 's', true, 16.0, 13.5, 11.5, 10.0, 9.0),
('Technique', 'Hexagon Test', 'M', 19, 25, 's', true, 14.5, 12.5, 10.8, 9.5, 8.5),
('Technique', 'Hexagon Test', 'M', 26, 35, 's', true, 15.0, 12.8, 11.0, 9.8, 8.8),
('Technique', 'Hexagon Test', 'M', 36, 99, 's', true, 16.0, 13.5, 11.5, 10.2, 9.2),
('Technique', 'Hexagon Test', 'F', 13, 15, 's', true, 20.0, 17.0, 14.5, 12.5, 11.0),
('Technique', 'Hexagon Test', 'F', 16, 18, 's', true, 18.0, 15.5, 13.5, 11.8, 10.5),
('Technique', 'Hexagon Test', 'F', 19, 25, 's', true, 16.5, 14.5, 12.5, 11.0, 10.0),
('Technique', 'Hexagon Test', 'F', 26, 35, 's', true, 17.0, 14.8, 12.8, 11.3, 10.2),
('Technique', 'Hexagon Test', 'F', 36, 99, 's', true, 18.0, 15.5, 13.5, 11.8, 10.5);

-- TACTIC TESTS (5 items) - Cognitive/Decision Making
-- 1. Reaction Time (ms)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Tactic', 'Reaction Time', 'M', 13, 15, 'ms', true, 400, 320, 260, 220, 180),
('Tactic', 'Reaction Time', 'M', 16, 18, 'ms', true, 350, 290, 240, 200, 170),
('Tactic', 'Reaction Time', 'M', 19, 25, 'ms', true, 320, 270, 225, 190, 160),
('Tactic', 'Reaction Time', 'M', 26, 35, 'ms', true, 330, 280, 230, 195, 165),
('Tactic', 'Reaction Time', 'M', 36, 99, 'ms', true, 360, 300, 250, 210, 175),
('Tactic', 'Reaction Time', 'F', 13, 15, 'ms', true, 420, 345, 280, 240, 200),
('Tactic', 'Reaction Time', 'F', 16, 18, 'ms', true, 380, 315, 260, 220, 185),
('Tactic', 'Reaction Time', 'F', 19, 25, 'ms', true, 350, 295, 245, 205, 175),
('Tactic', 'Reaction Time', 'F', 26, 35, 'ms', true, 360, 300, 250, 210, 180),
('Tactic', 'Reaction Time', 'F', 36, 99, 'ms', true, 380, 320, 265, 225, 190);

-- 2. Decision Making Test (score)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Tactic', 'Decision Making', 'ALL', 13, 15, 'score', false, 40, 55, 70, 82, 92),
('Tactic', 'Decision Making', 'ALL', 16, 18, 'score', false, 45, 60, 73, 85, 94),
('Tactic', 'Decision Making', 'ALL', 19, 25, 'score', false, 50, 65, 78, 88, 96),
('Tactic', 'Decision Making', 'ALL', 26, 35, 'score', false, 52, 67, 80, 90, 97),
('Tactic', 'Decision Making', 'ALL', 36, 99, 'score', false, 50, 65, 78, 88, 96);

-- 3. Anticipation Test (score)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Tactic', 'Anticipation Test', 'ALL', 13, 15, 'score', false, 35, 50, 65, 78, 88),
('Tactic', 'Anticipation Test', 'ALL', 16, 18, 'score', false, 42, 57, 70, 82, 91),
('Tactic', 'Anticipation Test', 'ALL', 19, 25, 'score', false, 48, 62, 75, 86, 94),
('Tactic', 'Anticipation Test', 'ALL', 26, 35, 'score', false, 50, 64, 77, 88, 95),
('Tactic', 'Anticipation Test', 'ALL', 36, 99, 'score', false, 48, 62, 75, 86, 94);

-- 4. Peripheral Vision (degrees)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Tactic', 'Peripheral Vision', 'ALL', 13, 15, 'degrees', false, 100, 120, 140, 160, 180),
('Tactic', 'Peripheral Vision', 'ALL', 16, 18, 'degrees', false, 110, 130, 150, 170, 190),
('Tactic', 'Peripheral Vision', 'ALL', 19, 25, 'degrees', false, 115, 135, 155, 175, 195),
('Tactic', 'Peripheral Vision', 'ALL', 26, 35, 'degrees', false, 115, 135, 155, 175, 195),
('Tactic', 'Peripheral Vision', 'ALL', 36, 99, 'degrees', false, 105, 125, 145, 165, 185);

-- 5. Sport-Specific Tactical Score
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Tactic', 'Tactical Assessment', 'ALL', 13, 15, 'score', false, 30, 45, 60, 75, 88),
('Tactic', 'Tactical Assessment', 'ALL', 16, 18, 'score', false, 38, 52, 66, 80, 91),
('Tactic', 'Tactical Assessment', 'ALL', 19, 25, 'score', false, 45, 58, 72, 85, 94),
('Tactic', 'Tactical Assessment', 'ALL', 26, 35, 'score', false, 48, 62, 75, 87, 96),
('Tactic', 'Tactical Assessment', 'ALL', 36, 99, 'score', false, 48, 62, 75, 87, 96);