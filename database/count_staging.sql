SELECT 'specialties' AS table, count(*) AS rows FROM public.src_specialties
UNION ALL
SELECT 'classes', count(*) FROM public.src_classes
UNION ALL
SELECT 'subjects', count(*) FROM public.src_subjects;
