
-- Insert 1RM norms (general strength benchmarks in kg)
INSERT INTO public.test_norms (category, item, unit, gender, age_min, age_max, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max)
VALUES
  ('Kekuatan', 'Estimasi 1RM', 'kg', 'ALL', 0, 99, false, 30, 50, 80, 120, 160);
