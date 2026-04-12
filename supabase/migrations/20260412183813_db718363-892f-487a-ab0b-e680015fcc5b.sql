
-- Insert VCr norms for Males
INSERT INTO public.test_norms (category, item, unit, gender, age_min, age_max, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max)
VALUES
  ('Daya Tahan', 'VCr (Critical Velocity)', 'm/s', 'M', 6, 9, false, 2.0, 2.5, 3.0, 3.5, 4.0),
  ('Daya Tahan', 'VCr (Critical Velocity)', 'm/s', 'M', 10, 12, false, 2.5, 3.0, 3.5, 4.0, 4.5),
  ('Daya Tahan', 'VCr (Critical Velocity)', 'm/s', 'M', 13, 15, false, 3.0, 3.5, 4.0, 4.5, 5.0),
  ('Daya Tahan', 'VCr (Critical Velocity)', 'm/s', 'M', 16, 18, false, 3.2, 3.7, 4.2, 4.7, 5.2),
  ('Daya Tahan', 'VCr (Critical Velocity)', 'm/s', 'M', 19, 25, false, 3.5, 4.0, 4.5, 5.0, 5.5),
  ('Daya Tahan', 'VCr (Critical Velocity)', 'm/s', 'M', 26, 30, false, 3.3, 3.8, 4.3, 4.8, 5.3),
  ('Daya Tahan', 'VCr (Critical Velocity)', 'm/s', 'M', 31, 99, false, 3.0, 3.5, 4.0, 4.5, 5.0),
-- Insert VCr norms for Females
  ('Daya Tahan', 'VCr (Critical Velocity)', 'm/s', 'F', 6, 9, false, 1.8, 2.2, 2.6, 3.0, 3.5),
  ('Daya Tahan', 'VCr (Critical Velocity)', 'm/s', 'F', 10, 12, false, 2.2, 2.6, 3.0, 3.5, 4.0),
  ('Daya Tahan', 'VCr (Critical Velocity)', 'm/s', 'F', 13, 15, false, 2.5, 3.0, 3.5, 4.0, 4.5),
  ('Daya Tahan', 'VCr (Critical Velocity)', 'm/s', 'F', 16, 18, false, 2.8, 3.2, 3.7, 4.2, 4.7),
  ('Daya Tahan', 'VCr (Critical Velocity)', 'm/s', 'F', 19, 25, false, 3.0, 3.5, 4.0, 4.5, 5.0),
  ('Daya Tahan', 'VCr (Critical Velocity)', 'm/s', 'F', 26, 30, false, 2.8, 3.3, 3.8, 4.3, 4.8),
  ('Daya Tahan', 'VCr (Critical Velocity)', 'm/s', 'F', 31, 99, false, 2.5, 3.0, 3.5, 4.0, 4.5);
