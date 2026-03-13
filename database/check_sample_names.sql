SELECT 'staff' AS table, id, first_name, last_name, gender
FROM public.staff
ORDER BY id
LIMIT 10;
SELECT 'students' AS table, id, first_name, last_name, gender
FROM public.students
ORDER BY id
LIMIT 10;
