SELECT 'tracks' AS section, count(*) AS total FROM public.tracks;
SELECT id, name, code FROM public.tracks ORDER BY id;
SELECT 'specialties' AS section, count(*) AS total FROM public.specialties;
SELECT id, name, code, track_id FROM public.specialties ORDER BY id;
