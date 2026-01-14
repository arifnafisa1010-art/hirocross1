-- Clear existing test norms and add new biomotor categories with age and gender based norms
DELETE FROM test_norms;

-- KEKUATAN (Strength) Tests
-- Push Up - Male
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Kekuatan', 'Push Up', 'M', 13, 15, 'reps', false, 15, 25, 35, 45, 999),
('Kekuatan', 'Push Up', 'M', 16, 19, 'reps', false, 20, 30, 40, 50, 999),
('Kekuatan', 'Push Up', 'M', 20, 29, 'reps', false, 25, 35, 45, 55, 999),
('Kekuatan', 'Push Up', 'M', 30, 39, 'reps', false, 20, 30, 40, 50, 999),
('Kekuatan', 'Push Up', 'M', 40, 99, 'reps', false, 15, 25, 35, 45, 999);

-- Push Up - Female
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Kekuatan', 'Push Up', 'F', 13, 15, 'reps', false, 8, 15, 22, 30, 999),
('Kekuatan', 'Push Up', 'F', 16, 19, 'reps', false, 10, 18, 26, 35, 999),
('Kekuatan', 'Push Up', 'F', 20, 29, 'reps', false, 12, 20, 28, 38, 999),
('Kekuatan', 'Push Up', 'F', 30, 39, 'reps', false, 10, 18, 26, 35, 999),
('Kekuatan', 'Push Up', 'F', 40, 99, 'reps', false, 8, 15, 22, 30, 999);

-- Pull Up - Male
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Kekuatan', 'Pull Up', 'M', 13, 15, 'reps', false, 3, 6, 10, 14, 999),
('Kekuatan', 'Pull Up', 'M', 16, 19, 'reps', false, 5, 9, 13, 17, 999),
('Kekuatan', 'Pull Up', 'M', 20, 29, 'reps', false, 6, 10, 15, 20, 999),
('Kekuatan', 'Pull Up', 'M', 30, 39, 'reps', false, 5, 8, 12, 16, 999),
('Kekuatan', 'Pull Up', 'M', 40, 99, 'reps', false, 3, 6, 10, 14, 999);

-- Pull Up - Female
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Kekuatan', 'Pull Up', 'F', 13, 15, 'reps', false, 1, 2, 4, 6, 999),
('Kekuatan', 'Pull Up', 'F', 16, 19, 'reps', false, 1, 3, 5, 8, 999),
('Kekuatan', 'Pull Up', 'F', 20, 29, 'reps', false, 2, 4, 6, 10, 999),
('Kekuatan', 'Pull Up', 'F', 30, 39, 'reps', false, 1, 3, 5, 8, 999),
('Kekuatan', 'Pull Up', 'F', 40, 99, 'reps', false, 1, 2, 4, 6, 999);

-- Sit Up 60s
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Kekuatan', 'Sit Up 60s', 'M', 13, 15, 'reps', false, 25, 35, 45, 55, 999),
('Kekuatan', 'Sit Up 60s', 'M', 16, 19, 'reps', false, 30, 40, 50, 60, 999),
('Kekuatan', 'Sit Up 60s', 'M', 20, 29, 'reps', false, 35, 45, 55, 65, 999),
('Kekuatan', 'Sit Up 60s', 'M', 30, 99, 'reps', false, 25, 35, 45, 55, 999),
('Kekuatan', 'Sit Up 60s', 'F', 13, 15, 'reps', false, 20, 28, 36, 44, 999),
('Kekuatan', 'Sit Up 60s', 'F', 16, 19, 'reps', false, 22, 30, 40, 50, 999),
('Kekuatan', 'Sit Up 60s', 'F', 20, 29, 'reps', false, 25, 33, 42, 52, 999),
('Kekuatan', 'Sit Up 60s', 'F', 30, 99, 'reps', false, 20, 28, 36, 44, 999);

-- Hand Grip
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Kekuatan', 'Hand Grip', 'M', 13, 15, 'kg', false, 25, 32, 40, 48, 999),
('Kekuatan', 'Hand Grip', 'M', 16, 19, 'kg', false, 35, 42, 50, 58, 999),
('Kekuatan', 'Hand Grip', 'M', 20, 29, 'kg', false, 40, 48, 55, 62, 999),
('Kekuatan', 'Hand Grip', 'M', 30, 99, 'kg', false, 38, 45, 52, 60, 999),
('Kekuatan', 'Hand Grip', 'F', 13, 15, 'kg', false, 18, 24, 30, 36, 999),
('Kekuatan', 'Hand Grip', 'F', 16, 19, 'kg', false, 22, 28, 34, 40, 999),
('Kekuatan', 'Hand Grip', 'F', 20, 29, 'kg', false, 25, 31, 37, 43, 999),
('Kekuatan', 'Hand Grip', 'F', 30, 99, 'kg', false, 23, 29, 35, 41, 999);

-- Leg Press
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Kekuatan', 'Leg Press', 'M', 13, 19, 'kg', false, 80, 120, 160, 200, 999),
('Kekuatan', 'Leg Press', 'M', 20, 99, 'kg', false, 100, 150, 200, 250, 999),
('Kekuatan', 'Leg Press', 'F', 13, 19, 'kg', false, 50, 80, 110, 140, 999),
('Kekuatan', 'Leg Press', 'F', 20, 99, 'kg', false, 60, 95, 130, 165, 999);

-- DAYA TAHAN (Endurance) Tests
-- Cooper Test 12min
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Daya Tahan', 'Cooper Test 12min', 'M', 13, 15, 'm', false, 1600, 2000, 2400, 2800, 9999),
('Daya Tahan', 'Cooper Test 12min', 'M', 16, 19, 'm', false, 1800, 2200, 2600, 3000, 9999),
('Daya Tahan', 'Cooper Test 12min', 'M', 20, 29, 'm', false, 1950, 2400, 2800, 3200, 9999),
('Daya Tahan', 'Cooper Test 12min', 'M', 30, 39, 'm', false, 1850, 2300, 2700, 3100, 9999),
('Daya Tahan', 'Cooper Test 12min', 'M', 40, 99, 'm', false, 1650, 2100, 2500, 2900, 9999),
('Daya Tahan', 'Cooper Test 12min', 'F', 13, 15, 'm', false, 1400, 1700, 2000, 2300, 9999),
('Daya Tahan', 'Cooper Test 12min', 'F', 16, 19, 'm', false, 1500, 1800, 2100, 2400, 9999),
('Daya Tahan', 'Cooper Test 12min', 'F', 20, 29, 'm', false, 1550, 1850, 2150, 2450, 9999),
('Daya Tahan', 'Cooper Test 12min', 'F', 30, 39, 'm', false, 1450, 1750, 2050, 2350, 9999),
('Daya Tahan', 'Cooper Test 12min', 'F', 40, 99, 'm', false, 1350, 1650, 1950, 2250, 9999);

-- Bleep Test (MFT)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Daya Tahan', 'Bleep Test', 'M', 13, 15, 'level', false, 4, 6, 8, 10, 99),
('Daya Tahan', 'Bleep Test', 'M', 16, 19, 'level', false, 5, 7, 9, 11, 99),
('Daya Tahan', 'Bleep Test', 'M', 20, 29, 'level', false, 6, 8, 10, 12, 99),
('Daya Tahan', 'Bleep Test', 'M', 30, 99, 'level', false, 5, 7, 9, 11, 99),
('Daya Tahan', 'Bleep Test', 'F', 13, 15, 'level', false, 3, 5, 7, 9, 99),
('Daya Tahan', 'Bleep Test', 'F', 16, 19, 'level', false, 4, 6, 8, 10, 99),
('Daya Tahan', 'Bleep Test', 'F', 20, 29, 'level', false, 4, 6, 8, 10, 99),
('Daya Tahan', 'Bleep Test', 'F', 30, 99, 'level', false, 3, 5, 7, 9, 99);

-- Yo-Yo IR1
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Daya Tahan', 'Yo-Yo IR1', 'M', 13, 15, 'level', false, 12, 14, 16, 18, 99),
('Daya Tahan', 'Yo-Yo IR1', 'M', 16, 19, 'level', false, 14, 16, 18, 20, 99),
('Daya Tahan', 'Yo-Yo IR1', 'M', 20, 29, 'level', false, 15, 17, 19, 21, 99),
('Daya Tahan', 'Yo-Yo IR1', 'M', 30, 99, 'level', false, 13, 15, 17, 19, 99),
('Daya Tahan', 'Yo-Yo IR1', 'F', 13, 15, 'level', false, 10, 12, 14, 16, 99),
('Daya Tahan', 'Yo-Yo IR1', 'F', 16, 19, 'level', false, 11, 13, 15, 17, 99),
('Daya Tahan', 'Yo-Yo IR1', 'F', 20, 29, 'level', false, 12, 14, 16, 18, 99),
('Daya Tahan', 'Yo-Yo IR1', 'F', 30, 99, 'level', false, 10, 12, 14, 16, 99);

-- Lari 2400m
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Daya Tahan', 'Lari 2400m', 'M', 13, 15, 'min', true, 14, 12.5, 11, 9.5, 0),
('Daya Tahan', 'Lari 2400m', 'M', 16, 19, 'min', true, 13, 11.5, 10, 8.5, 0),
('Daya Tahan', 'Lari 2400m', 'M', 20, 29, 'min', true, 12.5, 11, 9.5, 8, 0),
('Daya Tahan', 'Lari 2400m', 'M', 30, 99, 'min', true, 14, 12.5, 11, 9.5, 0),
('Daya Tahan', 'Lari 2400m', 'F', 13, 15, 'min', true, 17, 15, 13, 11, 0),
('Daya Tahan', 'Lari 2400m', 'F', 16, 19, 'min', true, 16, 14, 12, 10, 0),
('Daya Tahan', 'Lari 2400m', 'F', 20, 29, 'min', true, 15.5, 13.5, 11.5, 9.5, 0),
('Daya Tahan', 'Lari 2400m', 'F', 30, 99, 'min', true, 17, 15, 13, 11, 0);

-- KECEPATAN (Speed) Tests
-- Sprint 30m
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Kecepatan', 'Sprint 30m', 'M', 13, 15, 's', true, 5.5, 5.0, 4.5, 4.0, 0),
('Kecepatan', 'Sprint 30m', 'M', 16, 19, 's', true, 5.0, 4.5, 4.0, 3.7, 0),
('Kecepatan', 'Sprint 30m', 'M', 20, 29, 's', true, 4.8, 4.3, 3.9, 3.5, 0),
('Kecepatan', 'Sprint 30m', 'M', 30, 99, 's', true, 5.2, 4.7, 4.2, 3.8, 0),
('Kecepatan', 'Sprint 30m', 'F', 13, 15, 's', true, 6.2, 5.7, 5.2, 4.7, 0),
('Kecepatan', 'Sprint 30m', 'F', 16, 19, 's', true, 5.8, 5.3, 4.8, 4.3, 0),
('Kecepatan', 'Sprint 30m', 'F', 20, 29, 's', true, 5.6, 5.1, 4.6, 4.1, 0),
('Kecepatan', 'Sprint 30m', 'F', 30, 99, 's', true, 6.0, 5.5, 5.0, 4.5, 0);

-- Sprint 60m
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Kecepatan', 'Sprint 60m', 'M', 13, 15, 's', true, 10.0, 9.0, 8.0, 7.2, 0),
('Kecepatan', 'Sprint 60m', 'M', 16, 19, 's', true, 9.0, 8.2, 7.4, 6.8, 0),
('Kecepatan', 'Sprint 60m', 'M', 20, 29, 's', true, 8.5, 7.8, 7.1, 6.5, 0),
('Kecepatan', 'Sprint 60m', 'M', 30, 99, 's', true, 9.2, 8.4, 7.6, 7.0, 0),
('Kecepatan', 'Sprint 60m', 'F', 13, 15, 's', true, 11.5, 10.5, 9.5, 8.5, 0),
('Kecepatan', 'Sprint 60m', 'F', 16, 19, 's', true, 10.5, 9.6, 8.7, 7.9, 0),
('Kecepatan', 'Sprint 60m', 'F', 20, 29, 's', true, 10.0, 9.2, 8.4, 7.6, 0),
('Kecepatan', 'Sprint 60m', 'F', 30, 99, 's', true, 10.8, 9.9, 9.0, 8.2, 0);

-- Sprint 100m
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Kecepatan', 'Sprint 100m', 'M', 13, 15, 's', true, 16.0, 14.5, 13.0, 12.0, 0),
('Kecepatan', 'Sprint 100m', 'M', 16, 19, 's', true, 14.5, 13.0, 12.0, 11.0, 0),
('Kecepatan', 'Sprint 100m', 'M', 20, 29, 's', true, 14.0, 12.5, 11.5, 10.5, 0),
('Kecepatan', 'Sprint 100m', 'M', 30, 99, 's', true, 15.0, 13.5, 12.5, 11.5, 0),
('Kecepatan', 'Sprint 100m', 'F', 13, 15, 's', true, 18.0, 16.5, 15.0, 14.0, 0),
('Kecepatan', 'Sprint 100m', 'F', 16, 19, 's', true, 16.5, 15.0, 13.8, 12.8, 0),
('Kecepatan', 'Sprint 100m', 'F', 20, 29, 's', true, 16.0, 14.5, 13.3, 12.3, 0),
('Kecepatan', 'Sprint 100m', 'F', 30, 99, 's', true, 17.0, 15.5, 14.3, 13.3, 0);

-- FLEKSIBILITAS (Flexibility) Tests
-- Sit and Reach
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Fleksibilitas', 'Sit and Reach', 'M', 13, 15, 'cm', false, 15, 22, 29, 36, 999),
('Fleksibilitas', 'Sit and Reach', 'M', 16, 19, 'cm', false, 18, 25, 32, 39, 999),
('Fleksibilitas', 'Sit and Reach', 'M', 20, 29, 'cm', false, 20, 27, 34, 41, 999),
('Fleksibilitas', 'Sit and Reach', 'M', 30, 99, 'cm', false, 16, 23, 30, 37, 999),
('Fleksibilitas', 'Sit and Reach', 'F', 13, 15, 'cm', false, 20, 27, 34, 41, 999),
('Fleksibilitas', 'Sit and Reach', 'F', 16, 19, 'cm', false, 23, 30, 37, 44, 999),
('Fleksibilitas', 'Sit and Reach', 'F', 20, 29, 'cm', false, 25, 32, 39, 46, 999),
('Fleksibilitas', 'Sit and Reach', 'F', 30, 99, 'cm', false, 21, 28, 35, 42, 999);

-- Shoulder Flexibility
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Fleksibilitas', 'Shoulder Flexibility', 'M', 13, 99, 'cm', true, 10, 5, 0, -5, -999),
('Fleksibilitas', 'Shoulder Flexibility', 'F', 13, 99, 'cm', true, 8, 3, -2, -7, -999);

-- Trunk Rotation
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Fleksibilitas', 'Trunk Rotation', 'M', 13, 99, 'degrees', false, 25, 35, 45, 55, 999),
('Fleksibilitas', 'Trunk Rotation', 'F', 13, 99, 'degrees', false, 30, 40, 50, 60, 999);

-- POWER Tests
-- Vertical Jump
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Power', 'Vertical Jump', 'M', 13, 15, 'cm', false, 30, 40, 50, 60, 999),
('Power', 'Vertical Jump', 'M', 16, 19, 'cm', false, 40, 50, 60, 70, 999),
('Power', 'Vertical Jump', 'M', 20, 29, 'cm', false, 45, 55, 65, 75, 999),
('Power', 'Vertical Jump', 'M', 30, 99, 'cm', false, 35, 45, 55, 65, 999),
('Power', 'Vertical Jump', 'F', 13, 15, 'cm', false, 22, 30, 38, 46, 999),
('Power', 'Vertical Jump', 'F', 16, 19, 'cm', false, 28, 36, 44, 52, 999),
('Power', 'Vertical Jump', 'F', 20, 29, 'cm', false, 30, 38, 46, 54, 999),
('Power', 'Vertical Jump', 'F', 30, 99, 'cm', false, 24, 32, 40, 48, 999);

-- Standing Long Jump
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Power', 'Standing Long Jump', 'M', 13, 15, 'cm', false, 160, 190, 220, 250, 999),
('Power', 'Standing Long Jump', 'M', 16, 19, 'cm', false, 190, 220, 250, 280, 999),
('Power', 'Standing Long Jump', 'M', 20, 29, 'cm', false, 200, 230, 260, 290, 999),
('Power', 'Standing Long Jump', 'M', 30, 99, 'cm', false, 180, 210, 240, 270, 999),
('Power', 'Standing Long Jump', 'F', 13, 15, 'cm', false, 130, 155, 180, 205, 999),
('Power', 'Standing Long Jump', 'F', 16, 19, 'cm', false, 150, 175, 200, 225, 999),
('Power', 'Standing Long Jump', 'F', 20, 29, 'cm', false, 160, 185, 210, 235, 999),
('Power', 'Standing Long Jump', 'F', 30, 99, 'cm', false, 140, 165, 190, 215, 999);

-- Medicine Ball Throw
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Power', 'Medicine Ball Throw', 'M', 13, 15, 'm', false, 4, 5.5, 7, 8.5, 999),
('Power', 'Medicine Ball Throw', 'M', 16, 19, 'm', false, 5.5, 7, 8.5, 10, 999),
('Power', 'Medicine Ball Throw', 'M', 20, 29, 'm', false, 6, 7.5, 9, 10.5, 999),
('Power', 'Medicine Ball Throw', 'M', 30, 99, 'm', false, 5, 6.5, 8, 9.5, 999),
('Power', 'Medicine Ball Throw', 'F', 13, 15, 'm', false, 3, 4, 5, 6, 999),
('Power', 'Medicine Ball Throw', 'F', 16, 19, 'm', false, 3.5, 4.5, 5.5, 6.5, 999),
('Power', 'Medicine Ball Throw', 'F', 20, 29, 'm', false, 4, 5, 6, 7, 999),
('Power', 'Medicine Ball Throw', 'F', 30, 99, 'm', false, 3.5, 4.5, 5.5, 6.5, 999);

-- KELINCAHAN (Agility) Tests
-- Agility T-Test
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Kelincahan', 'Agility T-Test', 'M', 13, 15, 's', true, 13.0, 11.5, 10.0, 9.0, 0),
('Kelincahan', 'Agility T-Test', 'M', 16, 19, 's', true, 12.0, 10.5, 9.5, 8.5, 0),
('Kelincahan', 'Agility T-Test', 'M', 20, 29, 's', true, 11.5, 10.0, 9.0, 8.0, 0),
('Kelincahan', 'Agility T-Test', 'M', 30, 99, 's', true, 12.5, 11.0, 10.0, 9.0, 0),
('Kelincahan', 'Agility T-Test', 'F', 13, 15, 's', true, 14.5, 13.0, 11.5, 10.5, 0),
('Kelincahan', 'Agility T-Test', 'F', 16, 19, 's', true, 13.5, 12.0, 10.8, 9.8, 0),
('Kelincahan', 'Agility T-Test', 'F', 20, 29, 's', true, 13.0, 11.5, 10.3, 9.3, 0),
('Kelincahan', 'Agility T-Test', 'F', 30, 99, 's', true, 14.0, 12.5, 11.3, 10.3, 0);

-- Illinois Agility
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Kelincahan', 'Illinois Agility', 'M', 13, 15, 's', true, 20.0, 18.0, 16.5, 15.0, 0),
('Kelincahan', 'Illinois Agility', 'M', 16, 19, 's', true, 18.5, 16.8, 15.5, 14.2, 0),
('Kelincahan', 'Illinois Agility', 'M', 20, 29, 's', true, 17.5, 16.0, 14.8, 13.8, 0),
('Kelincahan', 'Illinois Agility', 'M', 30, 99, 's', true, 19.0, 17.3, 16.0, 14.8, 0),
('Kelincahan', 'Illinois Agility', 'F', 13, 15, 's', true, 22.5, 20.5, 18.5, 17.0, 0),
('Kelincahan', 'Illinois Agility', 'F', 16, 19, 's', true, 21.0, 19.0, 17.5, 16.0, 0),
('Kelincahan', 'Illinois Agility', 'F', 20, 29, 's', true, 20.0, 18.2, 16.8, 15.5, 0),
('Kelincahan', 'Illinois Agility', 'F', 30, 99, 's', true, 21.5, 19.5, 18.0, 16.5, 0);

-- Hexagon Test
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Kelincahan', 'Hexagon Test', 'M', 13, 15, 's', true, 16.0, 14.0, 12.0, 10.5, 0),
('Kelincahan', 'Hexagon Test', 'M', 16, 19, 's', true, 14.5, 12.8, 11.2, 9.8, 0),
('Kelincahan', 'Hexagon Test', 'M', 20, 29, 's', true, 14.0, 12.3, 10.8, 9.5, 0),
('Kelincahan', 'Hexagon Test', 'M', 30, 99, 's', true, 15.0, 13.2, 11.6, 10.2, 0),
('Kelincahan', 'Hexagon Test', 'F', 13, 15, 's', true, 18.0, 15.8, 13.8, 12.0, 0),
('Kelincahan', 'Hexagon Test', 'F', 16, 19, 's', true, 16.5, 14.5, 12.8, 11.2, 0),
('Kelincahan', 'Hexagon Test', 'F', 20, 29, 's', true, 16.0, 14.0, 12.3, 10.8, 0),
('Kelincahan', 'Hexagon Test', 'F', 30, 99, 's', true, 17.0, 15.0, 13.2, 11.5, 0);

-- KESEIMBANGAN (Balance) Tests
-- Stork Stand Test
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Keseimbangan', 'Stork Stand Test', 'M', 13, 19, 's', false, 20, 35, 50, 65, 999),
('Keseimbangan', 'Stork Stand Test', 'M', 20, 99, 's', false, 25, 40, 55, 70, 999),
('Keseimbangan', 'Stork Stand Test', 'F', 13, 19, 's', false, 18, 32, 46, 60, 999),
('Keseimbangan', 'Stork Stand Test', 'F', 20, 99, 's', false, 22, 36, 50, 64, 999);

-- Y Balance Test
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Keseimbangan', 'Y Balance Test', 'M', 13, 99, 'cm', false, 70, 85, 100, 115, 999),
('Keseimbangan', 'Y Balance Test', 'F', 13, 99, 'cm', false, 65, 80, 95, 110, 999);

-- Single Leg Stance
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Keseimbangan', 'Single Leg Stance', 'M', 13, 19, 's', false, 15, 30, 45, 60, 999),
('Keseimbangan', 'Single Leg Stance', 'M', 20, 39, 's', false, 20, 35, 50, 65, 999),
('Keseimbangan', 'Single Leg Stance', 'M', 40, 99, 's', false, 12, 25, 38, 52, 999),
('Keseimbangan', 'Single Leg Stance', 'F', 13, 19, 's', false, 18, 33, 48, 63, 999),
('Keseimbangan', 'Single Leg Stance', 'F', 20, 39, 's', false, 22, 37, 52, 67, 999),
('Keseimbangan', 'Single Leg Stance', 'F', 40, 99, 's', false, 14, 27, 40, 54, 999);

-- REAKSI (Reaction) Tests
-- Reaction Time (Ruler Drop)
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Reaksi', 'Reaction Time', 'M', 13, 15, 'ms', true, 350, 280, 220, 170, 0),
('Reaksi', 'Reaction Time', 'M', 16, 19, 'ms', true, 320, 260, 200, 155, 0),
('Reaksi', 'Reaction Time', 'M', 20, 29, 'ms', true, 300, 245, 190, 145, 0),
('Reaksi', 'Reaction Time', 'M', 30, 99, 'ms', true, 340, 275, 215, 165, 0),
('Reaksi', 'Reaction Time', 'F', 13, 15, 'ms', true, 380, 310, 250, 195, 0),
('Reaksi', 'Reaction Time', 'F', 16, 19, 'ms', true, 350, 285, 225, 175, 0),
('Reaksi', 'Reaction Time', 'F', 20, 29, 'ms', true, 330, 270, 210, 160, 0),
('Reaksi', 'Reaction Time', 'F', 30, 99, 'ms', true, 370, 300, 240, 185, 0);

-- Audio Reaction
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Reaksi', 'Audio Reaction', 'M', 13, 99, 'ms', true, 280, 230, 180, 140, 0),
('Reaksi', 'Audio Reaction', 'F', 13, 99, 'ms', true, 310, 255, 200, 155, 0);

-- Visual Reaction
INSERT INTO test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max) VALUES
('Reaksi', 'Visual Reaction', 'M', 13, 99, 'ms', true, 320, 265, 210, 165, 0),
('Reaksi', 'Visual Reaction', 'F', 13, 99, 'ms', true, 350, 290, 235, 185, 0);