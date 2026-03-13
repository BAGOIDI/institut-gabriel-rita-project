BEGIN;

-- Subjects
INSERT INTO public.subjects (id, code, name, credits)
VALUES
  (1, 'MATH', 'Mathématiques', 0),
  (2, 'FR', 'Français', 0),
  (3, 'PHY-CHI', 'Physique-Chimie', 0),
  (4, 'EN', 'Anglais', 0),
  (5, 'SVT', 'SVT', 0),
  (6, 'HG', 'Histoire-Géo', 0),
  (7, 'EPS', 'EPS', 0),
  (8, 'PHILO', 'Philosophie', 0),
  (9, 'INFO', 'Informatique', 0)
ON CONFLICT (id) DO NOTHING;

-- Staff (teachers)
INSERT INTO public.staff (id, first_name, last_name, phone_number, status)
VALUES
  (1, 'Alice', 'Dupont', '670000001', 'ACTIVE'),
  (2, 'Bruno', 'Ngono', '670000002', 'ACTIVE'),
  (3, 'Claire', 'Manga', '670000003', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Classes
INSERT INTO public.classes (id, name, level, specialty_id, capacity)
VALUES
  (1, '6ème A', '6EME', NULL, 50),
  (2, '5ème A', '5EME', NULL, 50)
ON CONFLICT (id) DO NOTHING;

-- Course schedules (dayOfWeek: 1=Lundi, 2=Mardi, 3=Mercredi ...)
INSERT INTO public.course_schedules (id, staff_id, subject_id, class_id, room_name, day_of_week, start_time, end_time, academic_year_id)
VALUES
  (1, 1, 1, 1, 'Salle 101', 1, '08:00', '09:50', NULL),
  (2, 2, 2, 1, 'Salle 101', 1, '10:05', '12:00', NULL),
  (3, 3, 3, 1, 'Salle 101', 1, '13:00', '14:50', NULL),
  (4, 1, 1, 1, 'Salle 101', 1, '15:05', '17:00', NULL),
  (5, 2, 4, 2, 'Salle 102', 2, '08:00', '09:50', NULL),
  (6, 3, 5, 2, 'Salle 102', 2, '10:05', '12:00', NULL),
  (7, 1, 6, 2, 'Salle 102', 2, '13:00', '14:50', NULL),
  (8, 2, 7, 2, 'Gymnase', 2, '15:05', '17:00', NULL),
  (9, 1, 8, 1, 'Salle 101', 3, '17:30', '19:20', NULL),
  (10, 3, 9, 1, 'Salle Info', 3, '19:35', '21:00', NULL)
ON CONFLICT (id) DO NOTHING;

-- Bump sequences
SELECT setval('public.subjects_id_seq', (SELECT COALESCE(MAX(id),1) FROM public.subjects), true);
SELECT setval('public.staff_id_seq', (SELECT COALESCE(MAX(id),1) FROM public.staff), true);
SELECT setval('public.classes_id_seq', (SELECT COALESCE(MAX(id),1) FROM public.classes), true);
SELECT setval('public.course_schedules_id_seq', (SELECT COALESCE(MAX(id),1) FROM public.course_schedules), true);

COMMIT;
