
-- Delete existing VCr norms
DELETE FROM public.test_norms WHERE item = 'VCr (Critical Velocity)';

-- Insert new universal VCr norms (no gender/age split needed per the provided table)
INSERT INTO public.test_norms (category, item, unit, gender, age_min, age_max, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max)
VALUES
  ('Daya Tahan', 'VCr (Critical Velocity)', 'm/s', 'ALL', 0, 99, false, 3.2, 3.2, 3.7, 4.2, 4.6);
