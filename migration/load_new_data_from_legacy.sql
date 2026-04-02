BEGIN;

-- 1) Vider les données applicatives (sans toucher aux tables Keycloak).
-- On garde volontairement public.roles et la majorité des tables "realm/client/user_entity/*".
TRUNCATE TABLE
  public.teacher_subject_class,
  public.grades,
  public.evaluations,
  public.payments,
  public.invoices,
  public.finance_payments,
  public.finance_payment_plans,
  public.finance_student_fees,
  public.finance_fee_types,
  public.attendance_records,
  public.attendance_device_logs,
  public.payroll_slips,
  public.payroll_periods,
  public.official_documents,
  public.whatsapp_notifications,
  public.disciplinary_actions,
  public.subjects,
  public.semesters,
  public.students,
  public.staff,
  public.classes,
  public.specialties,
  public.tracks,
  public.users
RESTART IDENTITY CASCADE;

-- 2) Tracks (filières)
WITH src AS (
  SELECT
    NULLIF(BTRIM(code), '') AS code,
    COALESCE(NULLIF(BTRIM(libelle), ''), NULLIF(BTRIM(code), ''), 'TRACK') AS name_base,
    NULLIF(BTRIM(coddom), '') AS description
  FROM legacy_access.filiere
  WHERE NULLIF(BTRIM(code), '') IS NOT NULL
),
dedup AS (
  SELECT
    code,
    CASE
      WHEN COUNT(*) OVER (PARTITION BY name_base) > 1 THEN name_base || ' (' || code || ')'
      ELSE name_base
    END AS name,
    description
  FROM src
)
INSERT INTO public.tracks (code, name, description)
SELECT DISTINCT ON (code)
  code, name, description
FROM dedup
ORDER BY code
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = COALESCE(EXCLUDED.description, public.tracks.description);

-- 3) Spécialités
INSERT INTO public.specialties (code, name, description)
SELECT
  NULLIF(BTRIM(code), '') AS code,
  COALESCE(NULLIF(BTRIM(libelle), ''), NULLIF(BTRIM(code), ''), 'SPECIALTY') AS name,
  NULLIF(BTRIM(cycle), '') AS description
FROM legacy_access.specialite
WHERE COALESCE(NULLIF(BTRIM(libelle), ''), NULLIF(BTRIM(code), '')) IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- 4) Semestres (on garde academic_year_id NULL)
INSERT INTO public.semesters (name, academic_year_id, "startDate", "endDate")
SELECT
  COALESCE(NULLIF(BTRIM(codses), ''), 'SEM') AS name,
  NULL::int AS academic_year_id,
  CASE
    WHEN NULLIF(BTRIM(datdeb), '') IS NULL THEN NULL
    WHEN BTRIM(datdeb) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN (BTRIM(datdeb))::date
    WHEN BTRIM(datdeb) ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' THEN to_date(BTRIM(datdeb), 'DD/MM/YYYY')
    ELSE NULL
  END AS "startDate",
  CASE
    WHEN NULLIF(BTRIM(datfin), '') IS NULL THEN NULL
    WHEN BTRIM(datfin) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN (BTRIM(datfin))::date
    WHEN BTRIM(datfin) ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' THEN to_date(BTRIM(datfin), 'DD/MM/YYYY')
    ELSE NULL
  END AS "endDate"
FROM legacy_access.semestre
WHERE NULLIF(BTRIM(codses), '') IS NOT NULL
ON CONFLICT DO NOTHING;

-- 5) Classes (créées à partir des inscriptions legacy_access.classe)
WITH distinct_classes AS (
  SELECT DISTINCT
    NULLIF(BTRIM(codfil), '') AS codfil,
    NULLIF(BTRIM(codniv), '') AS codniv
  FROM legacy_access.classe
  WHERE NULLIF(BTRIM(codfil), '') IS NOT NULL
     OR NULLIF(BTRIM(codniv), '') IS NOT NULL
)
INSERT INTO public.classes (name, level, specialty_id, "tuitionFee", academic_year_id, campus_id)
SELECT
  CONCAT_WS(' - ',
    COALESCE(codfil, 'FIL'),
    COALESCE(codniv, 'NIV')
  ) AS name,
  COALESCE(codniv, '1') AS level,
  NULL::int AS specialty_id,
  0::numeric(10,2) AS "tuitionFee",
  NULL::int AS academic_year_id,
  NULL::int AS campus_id
FROM distinct_classes
ON CONFLICT DO NOTHING;

-- 6) Students
WITH latest_class AS (
  SELECT DISTINCT ON (BTRIM(codetu))
    BTRIM(codetu) AS codetu,
    CONCAT_WS(' - ',
      COALESCE(NULLIF(BTRIM(codfil), ''), 'FIL'),
      COALESCE(NULLIF(BTRIM(codniv), ''), 'NIV')
    ) AS class_name
  FROM legacy_access.classe
  WHERE NULLIF(BTRIM(codetu), '') IS NOT NULL
  ORDER BY BTRIM(codetu), BTRIM(annee) DESC NULLS LAST
)
INSERT INTO public.students
  (matricule, first_name, last_name, phone_number, place_of_birth, date_of_birth, special_status, class_id)
SELECT
  NULLIF(BTRIM(e.codetu), '') AS matricule,
  NULLIF(BTRIM(e.preetu), '') AS first_name,
  NULLIF(BTRIM(e.nometu), '') AS last_name,
  NULLIF(BTRIM(e.teletu), '') AS phone_number,
  NULLIF(BTRIM(e.lienai), '') AS place_of_birth,
  CASE
    WHEN NULLIF(BTRIM(e.datnai), '') IS NULL THEN NULL
    WHEN BTRIM(e.datnai) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN (BTRIM(e.datnai))::date
    WHEN BTRIM(e.datnai) ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' THEN to_date(BTRIM(e.datnai), 'DD/MM/YYYY')
    ELSE NULL
  END AS date_of_birth,
  NULLIF(BTRIM(e.distinction), '') AS special_status,
  c.id AS class_id
FROM legacy_access.etudiant e
LEFT JOIN latest_class lc ON lc.codetu = BTRIM(e.codetu)
LEFT JOIN public.classes c ON c.name = lc.class_name
WHERE NULLIF(BTRIM(e.codetu), '') IS NOT NULL
ON CONFLICT (matricule) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone_number = EXCLUDED.phone_number,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    special_status = EXCLUDED.special_status,
    class_id = EXCLUDED.class_id;

-- 7) Staff (enseignants)
INSERT INTO public.staff
  (matricule, first_name, last_name, phone_number, address, specialty)
SELECT
  NULLIF(BTRIM(codpro), '') AS matricule,
  NULLIF(BTRIM(prepro), '') AS first_name,
  COALESCE(NULLIF(BTRIM(nompro), ''), 'STAFF') AS last_name,
  NULLIF(BTRIM(telpro), '') AS phone_number,
  NULLIF(BTRIM(adrpro), '') AS address,
  NULLIF(BTRIM(distinction), '') AS specialty
FROM legacy_access.professeur
WHERE COALESCE(NULLIF(BTRIM(codpro), ''), NULLIF(BTRIM(nompro), '')) IS NOT NULL
ON CONFLICT (matricule) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone_number = EXCLUDED.phone_number,
    address = EXCLUDED.address,
    specialty = EXCLUDED.specialty;

-- 8) Users (comptes legacy) : on ne peut pas recréer un hash fiable sans connaître l’algorithme.
-- On stocke un marqueur 'LEGACY:' pour forcer un reset côté applicatif.
INSERT INTO public.users (username, password_hash, is_active, role_id)
SELECT
  COALESCE(NULLIF(BTRIM(coduti), ''), NULLIF(BTRIM(nomuti), '')) AS username,
  'LEGACY:' || COALESCE(NULLIF(BTRIM(passe), ''), 'UNKNOWN') AS password_hash,
  TRUE AS is_active,
  NULL::int AS role_id
FROM legacy_access.utilisateur
WHERE COALESCE(NULLIF(BTRIM(coduti), ''), NULLIF(BTRIM(nomuti), '')) IS NOT NULL
ON CONFLICT (username) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    is_active = TRUE;

COMMIT;

-- 9) Nettoyage: retirer " - 2024/2025" si présent dans les noms de classes
UPDATE public.classes
SET name = regexp_replace(name, '\s*-\s*2024/2025\s*$', '', 'g')
WHERE name ~ '\s*-\s*2024/2025\s*$';

-- Quick sanity checks
SELECT 'students' AS table, COUNT(*) AS rows FROM public.students
UNION ALL SELECT 'staff', COUNT(*) FROM public.staff
UNION ALL SELECT 'classes', COUNT(*) FROM public.classes
UNION ALL SELECT 'specialties', COUNT(*) FROM public.specialties
UNION ALL SELECT 'tracks', COUNT(*) FROM public.tracks
UNION ALL SELECT 'semesters', COUNT(*) FROM public.semesters
UNION ALL SELECT 'users', COUNT(*) FROM public.users;

