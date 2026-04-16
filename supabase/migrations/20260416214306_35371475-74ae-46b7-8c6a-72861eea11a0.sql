
-- Remove old RAST norms (3 separate items)
DELETE FROM public.test_norms 
WHERE category = 'Kecepatan' 
  AND item IN ('RAST Test (Peak Power)', 'RAST Test (Average Power)', 'RAST Test (Fatigue Index)', 'RAST Test');

-- Insert single RAST Test norm based on Peak Power (watt)
-- Source: standardized RAST norms; higher peak power = better (lower_is_better = false)
-- Score 5 = Sangat Baik, Score 1 = Sangat Kurang

-- MALE adults (16-30 years)
INSERT INTO public.test_norms (category, item, gender, age_min, age_max, unit, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max)
VALUES
  ('Kecepatan', 'RAST Test', 'M', 16, 30, 'watt', false, 400, 550, 700, 850, 1000),
  ('Kecepatan', 'RAST Test', 'M', 13, 15, 'watt', false, 250, 350, 450, 550, 700),
  ('Kecepatan', 'RAST Test', 'M', 31, 99, 'watt', false, 350, 500, 650, 800, 950),
  ('Kecepatan', 'RAST Test', 'F', 16, 30, 'watt', false, 250, 350, 450, 550, 700),
  ('Kecepatan', 'RAST Test', 'F', 13, 15, 'watt', false, 180, 250, 320, 400, 500),
  ('Kecepatan', 'RAST Test', 'F', 31, 99, 'watt', false, 220, 320, 420, 520, 650);
