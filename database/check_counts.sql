SELECT 'specialties' AS table, count(*) FROM public.specialties
UNION ALL
SELECT 'classes', count(*) FROM public.classes
UNION ALL
SELECT 'subjects', count(*) FROM public.subjects
UNION ALL
SELECT 'users', count(*) FROM public.users
UNION ALL
SELECT 'staff', count(*) FROM public.staff
UNION ALL
SELECT 'students', count(*) FROM public.students
UNION ALL
SELECT 'course_schedules', count(*) FROM public.course_schedules
UNION ALL
SELECT 'evaluations', count(*) FROM public.evaluations
UNION ALL
SELECT 'grades', count(*) FROM public.grades
UNION ALL
SELECT 'finance_fee_types', count(*) FROM public.finance_fee_types
UNION ALL
SELECT 'finance_student_fees', count(*) FROM public.finance_student_fees
UNION ALL
SELECT 'finance_payments', count(*) FROM public.finance_payments;
