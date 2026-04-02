BEGIN;

-- 1) Add missing subjects keyed by legacy short code (codmat)
-- Legacy scheduling tables reference codes like ENGLISH, STATSTIC2, etc.
INSERT INTO public.subjects (code, name, credits, specialty_id)
SELECT DISTINCT
  UPPER(BTRIM(m.code)) AS code,
  COALESCE(NULLIF(regexp_replace(BTRIM(m.libelle), '[\r\n]+', ' ', 'g'), ''), UPPER(BTRIM(m.code))) AS name,
  0 AS credits,
  NULL::int AS specialty_id
FROM legacy_access.matisugri m
WHERE NULLIF(BTRIM(m.code), '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.subjects s
    WHERE UPPER(BTRIM(s.code)) = UPPER(BTRIM(m.code))
  );

-- 2) Populate teacher_subject_class from legacy programmation2
WITH src AS (
  SELECT DISTINCT
    UPPER(BTRIM(p.codpro)) AS codpro,
    UPPER(BTRIM(p.codmat)) AS codmat,
    UPPER(BTRIM(p.codfil)) AS codfil,
    BTRIM(p.codniv) AS codniv,
    NULLIF(BTRIM(p.annee), '') AS annee
  FROM legacy_access.programmation2 p
  WHERE NULLIF(BTRIM(p.codpro), '') IS NOT NULL
    AND NULLIF(BTRIM(p.codmat), '') IS NOT NULL
    AND NULLIF(BTRIM(p.codfil), '') IS NOT NULL
    AND NULLIF(BTRIM(p.codniv), '') IS NOT NULL
),
mapped AS (
  SELECT
    st.id AS staff_id,
    su.id AS subject_id,
    cl.id AS class_id,
    MAX(ay.id) AS academic_year_id
  FROM src x
  JOIN public.staff st
    ON UPPER(BTRIM(st.matricule)) = x.codpro
  JOIN public.subjects su
    ON UPPER(BTRIM(su.code)) = x.codmat
  JOIN public.classes cl
    ON cl.name = CONCAT(x.codfil, ' - ', x.codniv)
  LEFT JOIN public.academic_years ay
    ON ay.name = x.annee
  GROUP BY st.id, su.id, cl.id
)
INSERT INTO public.teacher_subject_class (staff_id, subject_id, class_id, academic_year_id)
SELECT m.staff_id, m.subject_id, m.class_id, m.academic_year_id
FROM mapped m
ON CONFLICT (staff_id, subject_id, class_id) DO UPDATE
SET academic_year_id = COALESCE(EXCLUDED.academic_year_id, public.teacher_subject_class.academic_year_id);

COMMIT;

SELECT
  (SELECT COUNT(*) FROM public.subjects) AS subjects_count,
  (SELECT COUNT(*) FROM public.teacher_subject_class) AS teacher_subject_class_count;

