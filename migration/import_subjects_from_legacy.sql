BEGIN;

-- Import "modules" (legacy) into subjects.
-- Strategy:
-- - code = legacy_access.modules.code
-- - name = legacy_access.modules.libelle (trimmed, CR/LF normalized)
-- - specialty_id mapped by legacy codspe -> public.specialties.code
-- - credits mapped from legacy "cr" when numeric, else 0
-- - semester_id/class_id left NULL (legacy tables don't map cleanly in current schema)

WITH src AS (
  SELECT
    NULLIF(BTRIM(code), '') AS code,
    NULLIF(regexp_replace(BTRIM(libelle), '[\r\n]+', ' ', 'g'), '') AS name,
    NULLIF(BTRIM(codspe), '') AS specialty_code,
    NULLIF(BTRIM(cr), '') AS cr_txt
  FROM legacy_access.modules
  WHERE NULLIF(BTRIM(code), '') IS NOT NULL
),
typed AS (
  SELECT
    code,
    COALESCE(name, code) AS name,
    specialty_code,
    CASE
      WHEN cr_txt ~ '^[0-9]+(\.[0-9]+)?$' THEN floor((cr_txt)::numeric)::int
      ELSE 0
    END AS credits
  FROM src
)
-- Insert missing ones, dedup by (code,name) because code is not unique in current schema.
INSERT INTO public.subjects (code, name, credits, specialty_id)
SELECT DISTINCT ON (t.code, t.name)
  t.code,
  t.name,
  t.credits,
  s.id AS specialty_id
FROM typed t
LEFT JOIN public.specialties s ON s.code = t.specialty_code
WHERE NOT EXISTS (
  SELECT 1 FROM public.subjects x
  WHERE x.code = t.code AND x.name = t.name
)
ORDER BY t.code, t.name;

COMMIT;

SELECT COUNT(*) AS subjects_after FROM public.subjects;

