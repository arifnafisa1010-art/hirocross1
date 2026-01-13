-- Add Yo-Yo Intermittent Recovery Test 1 norms for Endurance category
-- Based on standard norms for different age groups and genders

-- Male norms (Young Adults 17-25)
INSERT INTO public.test_norms (category, item, unit, gender, age_min, age_max, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max)
VALUES 
('Endurance', 'Yo-Yo IR1', 'level', 'M', 17, 25, false, 14.0, 15.0, 17.0, 19.0, 21.0);

-- Male norms (Adults 26-35)
INSERT INTO public.test_norms (category, item, unit, gender, age_min, age_max, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max)
VALUES 
('Endurance', 'Yo-Yo IR1', 'level', 'M', 26, 35, false, 13.0, 14.0, 16.0, 18.0, 20.0);

-- Male norms (Masters 36-50)
INSERT INTO public.test_norms (category, item, unit, gender, age_min, age_max, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max)
VALUES 
('Endurance', 'Yo-Yo IR1', 'level', 'M', 36, 50, false, 11.0, 12.0, 14.0, 16.0, 18.0);

-- Female norms (Young Adults 17-25)
INSERT INTO public.test_norms (category, item, unit, gender, age_min, age_max, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max)
VALUES 
('Endurance', 'Yo-Yo IR1', 'level', 'F', 17, 25, false, 12.0, 13.0, 15.0, 17.0, 19.0);

-- Female norms (Adults 26-35)
INSERT INTO public.test_norms (category, item, unit, gender, age_min, age_max, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max)
VALUES 
('Endurance', 'Yo-Yo IR1', 'level', 'F', 26, 35, false, 11.0, 12.0, 14.0, 16.0, 18.0);

-- Female norms (Masters 36-50)
INSERT INTO public.test_norms (category, item, unit, gender, age_min, age_max, lower_is_better, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max)
VALUES 
('Endurance', 'Yo-Yo IR1', 'level', 'F', 36, 50, false, 9.0, 10.0, 12.0, 14.0, 16.0);