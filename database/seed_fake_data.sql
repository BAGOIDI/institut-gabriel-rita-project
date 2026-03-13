INSERT INTO public.academic_years (name, start_date, end_date, is_active)
SELECT '2025-2026', DATE '2025-09-01', DATE '2026-07-15', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.academic_years WHERE name = '2025-2026');
INSERT INTO public.academic_years (name, start_date, end_date, is_active)
SELECT '2024-2025', DATE '2024-09-01', DATE '2025-07-15', FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.academic_years WHERE name = '2024-2025');
WITH ay AS (SELECT id FROM public.academic_years WHERE name='2025-2026')
INSERT INTO public.semesters (academic_year_id, name, start_date, end_date)
SELECT (SELECT id FROM ay), 'Semestre 1', DATE '2025-09-01', DATE '2025-12-31'
WHERE NOT EXISTS (SELECT 1 FROM public.semesters WHERE academic_year_id=(SELECT id FROM ay) AND name='Semestre 1');
WITH ay AS (SELECT id FROM public.academic_years WHERE name='2025-2026')
INSERT INTO public.semesters (academic_year_id, name, start_date, end_date)
SELECT (SELECT id FROM ay), 'Semestre 2', DATE '2026-02-01', DATE '2026-06-30'
WHERE NOT EXISTS (SELECT 1 FROM public.semesters WHERE academic_year_id=(SELECT id FROM ay) AND name='Semestre 2');
INSERT INTO public.roles (name) VALUES ('ADMIN') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.roles (name) VALUES ('TEACHER') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.roles (name) VALUES ('CASHIER') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.users (username, password_hash, role_id, is_active)
SELECT 'admin', md5('admin'), id, TRUE FROM public.roles WHERE name='ADMIN'
ON CONFLICT (username) DO NOTHING;
WITH r AS (SELECT id FROM public.roles WHERE name='TEACHER')
INSERT INTO public.users (username, password_hash, role_id, is_active)
SELECT 'teacher' || gs::text, md5('teacher' || gs::text), r.id, TRUE
FROM generate_series(1, 50) AS gs, r
ON CONFLICT (username) DO NOTHING;
WITH r AS (SELECT id FROM public.roles WHERE name='CASHIER')
INSERT INTO public.users (username, password_hash, role_id, is_active)
SELECT 'cashier' || gs::text, md5('cashier' || gs::text), r.id, TRUE
FROM generate_series(1, 2) AS gs, r
ON CONFLICT (username) DO NOTHING;
INSERT INTO public.staff (user_id, matricule, first_name, last_name, gender, date_of_birth, phone_number, email, address, created_at)
WITH male_first AS (
  SELECT ARRAY['Alain','Blaise','Brice','Cédric','Didier','Emmanuel','Franck','Gaël','Hermann','Jean','Joseph','Kevin','Lionel','Noël','Paul','Serge','Samuel','Steve','Ulrich','Yannick','Yves','Boris','Arnaud','Junior','Rostand','Stephane','Guy','Marcel','Dieudonné','Roland','Oumarou','Moussa','Boubakary'] AS arr
), female_first AS (
  SELECT ARRAY['Aissatou','Nadine','Brenda','Estelle','Arielle','Clarisse','Sandrine','Cynthia','Patricia','Priscille','Dominique','Flore','Rosine','Carine','Blandine','Mireille','Tatiana','Josiane','Chantal','Fatou','Aminatou'] AS arr
), last_names AS (
  SELECT ARRAY['Njoya','Mouelle','Mbappe','Biya','Ngannou','Kamdem','Kamga','Simo','Fokou','Fotso','Toukam','Tchatchoua','Tchuisseu','Fonkou','Fonkoua','Ngassa','Nkamga','Nana','Djomo','Djoumessi','Ntsama','Essomba','Mballa','Mvondo','Atangana','Ndzana','Amougou','Belinga','Moukouri','Ewodo','Nlend','Enow','Nguefack','Nguena','Nke','Ndzongang','Yamo','Tientcheu','Nteme','Nguele','Mahamat','Aboubakar','Issa'] AS arr
)
SELECT u.id,
       'MAT-' || lpad(u.id::text, 5, '0'),
       CASE WHEN (u.id % 2)=0
            THEN (SELECT arr[1 + (u.id % array_length(arr,1))] FROM male_first)
            ELSE (SELECT arr[1 + (u.id % array_length(arr,1))] FROM female_first)
       END,
       (SELECT arr[1 + ((u.id * 7) % array_length(arr,1))] FROM last_names),
       CASE WHEN (u.id % 2)=0 THEN 'M' ELSE 'F' END,
       DATE '1985-01-01' + ((u.id % 5000)) * INTERVAL '1 day',
       '690' || lpad((100000 + (u.id % 900000))::text, 6, '0'),
       'teacher' || u.id::text || '@demo.local',
       'Adresse ' || u.id::text,
       NOW()
FROM public.users u
JOIN public.roles r ON u.role_id = r.id AND r.name='TEACHER'
LEFT JOIN public.staff s ON s.user_id = u.id
WHERE s.user_id IS NULL;
INSERT INTO public.students (matricule, first_name, last_name, gender, date_of_birth, phone_number, email, parent_phone_number, class_id, special_status, photo, created_at)
WITH male_first AS (
  SELECT ARRAY['Alain','Blaise','Brice','Cédric','Didier','Emmanuel','Franck','Gaël','Hermann','Jean','Joseph','Kevin','Lionel','Noël','Paul','Serge','Samuel','Steve','Ulrich','Yannick','Yves','Boris','Arnaud','Junior','Rostand','Stephane','Guy','Marcel','Dieudonné','Roland','Oumarou','Moussa','Boubakary'] AS arr
), female_first AS (
  SELECT ARRAY['Aissatou','Nadine','Brenda','Estelle','Arielle','Clarisse','Sandrine','Cynthia','Patricia','Priscille','Dominique','Flore','Rosine','Carine','Blandine','Mireille','Tatiana','Josiane','Chantal','Fatou','Aminatou'] AS arr
), last_names AS (
  SELECT ARRAY['Njoya','Mouelle','Mbappe','Biya','Ngannou','Kamdem','Kamga','Simo','Fokou','Fotso','Toukam','Tchatchoua','Tchuisseu','Fonkou','Fonkoua','Ngassa','Nkamga','Nana','Djomo','Djoumessi','Ntsama','Essomba','Mballa','Mvondo','Atangana','Ndzana','Amougou','Belinga','Moukouri','Ewodo','Nlend','Enow','Nguefack','Nguena','Nke','Ndzongang','Yamo','Tientcheu','Nteme','Nguele','Mahamat','Aboubakar','Issa'] AS arr
)
SELECT 'STU-' || c.id || '-' || gs::text,
       CASE WHEN (gs % 2)=0
            THEN (SELECT arr[1 + ((c.id + gs) % array_length(arr,1))] FROM male_first)
            ELSE (SELECT arr[1 + ((c.id + gs) % array_length(arr,1))] FROM female_first)
       END,
       (SELECT arr[1 + (((c.id * 13) + gs) % array_length(arr,1))] FROM last_names),
       CASE WHEN (gs % 2)=0 THEN 'M' ELSE 'F' END,
       DATE '2003-01-01' + ((c.id + gs) % 4000) * INTERVAL '1 day',
       NULL,
       NULL,
       NULL,
       c.id,
       NULL,
       NULL,
       NOW()
FROM public.classes c
JOIN generate_series(1, 20) AS gs ON TRUE
LEFT JOIN public.students st ON st.class_id = c.id AND st.matricule = 'STU-' || c.id || '-' || gs::text
WHERE st.id IS NULL;
SELECT setval(pg_get_serial_sequence('public.specialties','id'), COALESCE((SELECT max(id) FROM public.specialties),0));
SELECT setval(pg_get_serial_sequence('public.classes','id'), COALESCE((SELECT max(id) FROM public.classes),0));
SELECT setval(pg_get_serial_sequence('public.subjects','id'), COALESCE((SELECT max(id) FROM public.subjects),0));
WITH ay AS (SELECT id FROM public.academic_years WHERE is_active = TRUE LIMIT 1)
INSERT INTO public.finance_fee_types (name, amount, academic_year_id)
SELECT 'Tuition', 200000.00, (SELECT id FROM ay)
WHERE NOT EXISTS (SELECT 1 FROM public.finance_fee_types WHERE name='Tuition' AND academic_year_id=(SELECT id FROM ay));
WITH ft AS (SELECT id, amount FROM public.finance_fee_types ORDER BY id LIMIT 1)
INSERT INTO public.finance_student_fees (student_id, fee_type_id, discount_amount, total_due, is_fully_paid)
SELECT s.id, ft.id, ROUND((random()*20000)::numeric,2), GREATEST(ft.amount - ROUND((random()*20000)::numeric,2), 0), FALSE
FROM public.students s
CROSS JOIN ft
LEFT JOIN public.finance_student_fees f ON f.student_id = s.id AND f.fee_type_id = ft.id
WHERE f.id IS NULL;
INSERT INTO public.finance_payments (student_fee_id, amount_paid, payment_method, receipt_number, recorded_by, payment_date)
SELECT f.id,
       ROUND((f.total_due * (0.3 + random()*0.5))::numeric,2),
       'CASH',
       'RCPT-' || lpad(f.id::text, 6, '0'),
       (SELECT id FROM public.users WHERE username='cashier1' LIMIT 1),
       NOW()
FROM public.finance_student_fees f
LEFT JOIN public.finance_payments p ON p.student_fee_id = f.id
WHERE p.id IS NULL;
WITH ay AS (SELECT id FROM public.academic_years WHERE is_active = TRUE LIMIT 1),
     s1 AS (SELECT id FROM public.semesters WHERE academic_year_id=(SELECT id FROM ay) AND name='Semestre 1' LIMIT 1),
     s2 AS (SELECT id FROM public.semesters WHERE academic_year_id=(SELECT id FROM ay) AND name='Semestre 2' LIMIT 1)
INSERT INTO public.evaluations (subject_id, academic_year_id, semester_id, name, type, weight_percent, max_score, date)
SELECT sub.id, (SELECT id FROM ay), (SELECT id FROM s1), 'Examen Final', 'SN', 100, 20.00, CURRENT_DATE
FROM public.subjects sub
WHERE NOT EXISTS (SELECT 1 FROM public.evaluations e WHERE e.subject_id=sub.id AND e.academic_year_id=(SELECT id FROM ay) AND e.semester_id=(SELECT id FROM s1));
WITH ay AS (SELECT id FROM public.academic_years WHERE is_active = TRUE LIMIT 1),
     s2 AS (SELECT id FROM public.semesters WHERE academic_year_id=(SELECT id FROM ay) AND name='Semestre 2' LIMIT 1)
INSERT INTO public.evaluations (subject_id, academic_year_id, semester_id, name, type, weight_percent, max_score, date)
SELECT sub.id, (SELECT id FROM ay), (SELECT id FROM s2), 'Examen Final', 'SN', 100, 20.00, CURRENT_DATE
FROM public.subjects sub
WHERE NOT EXISTS (SELECT 1 FROM public.evaluations e WHERE e.subject_id=sub.id AND e.academic_year_id=(SELECT id FROM ay) AND e.semester_id=(SELECT id FROM s2));
WITH ev AS (
  SELECT e.id AS evaluation_id, e.subject_id
  FROM public.evaluations e
),
stu AS (
  SELECT st.id AS student_id, c.specialty_id
  FROM public.students st
  JOIN public.classes c ON c.id = st.class_id
)
INSERT INTO public.grades (student_id, evaluation_id, score, is_absent, comments, created_at)
SELECT stu.student_id, ev.evaluation_id, ROUND(8 + (random()*10)::numeric,2), FALSE, NULL, NOW()
FROM ev
JOIN stu ON stu.specialty_id = (SELECT s.specialty_id FROM public.subjects s WHERE s.id = ev.subject_id)
LEFT JOIN public.grades g ON g.student_id = stu.student_id AND g.evaluation_id = ev.evaluation_id
WHERE g.id IS NULL;
WITH ay AS (SELECT id FROM public.academic_years WHERE is_active = TRUE LIMIT 1),
     sem AS (SELECT id FROM public.semesters WHERE academic_year_id=(SELECT id FROM ay))
INSERT INTO public.bulletins (student_id, academic_year_id, semester_id, total_credits_attempted, total_credits_earned, gpa, decision, is_published, created_at)
SELECT st.id, (SELECT id FROM ay), sem.id, 60, 45 + (st.id % 10), ROUND((10 + (random()*7))::numeric,2), 'ADMIS', FALSE, NOW()
FROM public.students st
CROSS JOIN sem
LEFT JOIN public.bulletins b ON b.student_id=st.id AND b.academic_year_id=(SELECT id FROM ay) AND b.semester_id=sem.id
WHERE b.id IS NULL;
WITH ay AS (SELECT id FROM public.academic_years WHERE is_active = TRUE LIMIT 1),
     tch AS (SELECT s.id AS staff_id FROM public.staff s)
INSERT INTO public.course_schedules (staff_id, subject_id, class_id, room_name, day_of_week, start_time, end_time, academic_year_id)
SELECT (SELECT id FROM public.staff ORDER BY id LIMIT 1),
       sub.id,
       c.id,
       'R-' || lpad(c.id::text,3,'0'),
       1 + ((c.id + sub.id) % 5),
       make_time(8 + ((c.id + sub.id) % 4)*2, 0, 0),
       make_time(10 + ((c.id + sub.id) % 4)*2, 0, 0),
       (SELECT id FROM ay)
FROM public.classes c
JOIN public.subjects sub ON sub.specialty_id = c.specialty_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.course_schedules cs
  WHERE cs.class_id=c.id AND cs.subject_id=sub.id AND cs.academic_year_id=(SELECT id FROM ay)
)
LIMIT 120;

-- Fake data for timetable days (TIMETABLE_DAY)
INSERT INTO public.system_options (category, value, label_fr, label_en, is_active)
VALUES 
  ('TIMETABLE_DAY', '1', 'Lundi',    'Monday',    TRUE),
  ('TIMETABLE_DAY', '2', 'Mardi',    'Tuesday',   TRUE),
  ('TIMETABLE_DAY', '3', 'Mercredi', 'Wednesday', TRUE),
  ('TIMETABLE_DAY', '4', 'Jeudi',    'Thursday',  TRUE),
  ('TIMETABLE_DAY', '5', 'Vendredi', 'Friday',    TRUE),
  ('TIMETABLE_DAY', '6', 'Samedi',   'Saturday',  TRUE)
ON CONFLICT DO NOTHING;

-- Fake data for timetable rooms (TIMETABLE_ROOM)
INSERT INTO public.system_options (category, value, label_fr, label_en, is_active)
VALUES 
  ('TIMETABLE_ROOM', 'R-001', 'Salle 1', 'Room 1', TRUE),
  ('TIMETABLE_ROOM', 'R-002', 'Salle 2', 'Room 2', TRUE),
  ('TIMETABLE_ROOM', 'R-003', 'Salle 3', 'Room 3', TRUE),
  ('TIMETABLE_ROOM', 'R-004', 'Salle 4', 'Room 4', TRUE),
  ('TIMETABLE_ROOM', 'R-005', 'Salle 5', 'Room 5', TRUE)
ON CONFLICT DO NOTHING;
