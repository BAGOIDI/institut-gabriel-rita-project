
-- =============================================
-- 1. GESTION FINANCIÈRE (Scolarité & Moratoires)
-- =============================================

CREATE TABLE IF NOT EXISTS public.finance_fee_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- Ex: "Scolarité 2023-2024", "Inscription"
    amount DECIMAL(10, 2) NOT NULL,
    academic_year_id INTEGER REFERENCES public.academic_years(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.finance_student_fees (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES public.students(id),
    fee_type_id INTEGER REFERENCES public.finance_fee_types(id),
    discount_amount DECIMAL(10, 2) DEFAULT 0, -- Réduction accordée
    total_due DECIMAL(10, 2) NOT NULL, -- Montant final à payer
    is_fully_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.finance_payments (
    id SERIAL PRIMARY KEY,
    student_fee_id INTEGER REFERENCES public.finance_student_fees(id),
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50), -- Cash, Virement, Mobile Money
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by INTEGER REFERENCES public.users(id), -- Qui a encaissé
    receipt_number VARCHAR(50) UNIQUE -- Numéro de reçu
);

CREATE TABLE IF NOT EXISTS public.finance_payment_plans (
    id SERIAL PRIMARY KEY,
    student_fee_id INTEGER REFERENCES public.finance_student_fees(id),
    due_date DATE NOT NULL, -- Nouvelle échéance (Moratoire)
    amount_expected DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PAID, OVERDUE
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. GESTION DES PRÉSENCES (Moteur de Règles)
-- =============================================

-- Logs bruts venant du K40 (via Sync Service)
CREATE TABLE IF NOT EXISTS public.attendance_device_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER, -- Peut être null si non reconnu
    device_id VARCHAR(50),
    timestamp TIMESTAMP NOT NULL,
    verification_mode VARCHAR(20), -- Fingerprint, Card, Face
    raw_data TEXT,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Présences consolidées (Après comparaison avec Planning)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id SERIAL PRIMARY KEY,
    person_type VARCHAR(20) NOT NULL, -- 'STUDENT' ou 'STAFF'
    person_id INTEGER NOT NULL, -- ID dans table students ou staff
    date DATE NOT NULL,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    status VARCHAR(20), -- PRESENT, ABSENT, LATE, EXCUSED
    lateness_minutes INTEGER DEFAULT 0, -- Retard en minutes
    course_id INTEGER REFERENCES public.classes(id), -- Lien avec le cours (si applicable)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 3. GESTION DE LA PAIE (Enseignants)
-- =============================================

CREATE TABLE IF NOT EXISTS public.payroll_periods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50), -- Ex: "Octobre 2023"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.payroll_slips (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES public.staff(id),
    period_id INTEGER REFERENCES public.payroll_periods(id),
    base_salary DECIMAL(10, 2),
    hourly_rate DECIMAL(10, 2),
    hours_worked DECIMAL(10, 2),
    overtime_hours DECIMAL(10, 2),
    deductions DECIMAL(10, 2), -- Retards, Absences
    bonuses DECIMAL(10, 2),
    net_salary DECIMAL(10, 2),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'DRAFT' -- DRAFT, VALIDATED, PAID
);

-- =============================================
-- 4. OPTIONS SYSTÈME (utilisé par le frontend)
-- =============================================

-- Table utilisée par service-core-scolarite (SystemOption entity)
CREATE TABLE IF NOT EXISTS public.system_options (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    value VARCHAR(255) NOT NULL,
    label_fr VARCHAR(255),
    label_en VARCHAR(255),
    label VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- S'assurer que les colonnes existent même si la table était déjà là
ALTER TABLE public.system_options
    ADD COLUMN IF NOT EXISTS label_fr VARCHAR(255),
    ADD COLUMN IF NOT EXISTS label_en VARCHAR(255),
    ADD COLUMN IF NOT EXISTS label VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Éviter les NULL bloquants si des données existent déjà
UPDATE public.system_options
SET label_fr = COALESCE(label_fr, label, value),
    label_en = COALESCE(label_en, label, value)
WHERE label_fr IS NULL OR label_en IS NULL;

-- Seed minimal pour l'emploi du temps
INSERT INTO public.system_options (category, value, label_fr, label_en, is_active)
SELECT * FROM (
  VALUES
    ('TIMETABLE_DAY','1','Lundi','Monday',true),
    ('TIMETABLE_DAY','2','Mardi','Tuesday',true),
    ('TIMETABLE_DAY','3','Mercredi','Wednesday',true),
    ('TIMETABLE_DAY','4','Jeudi','Thursday',true),
    ('TIMETABLE_DAY','5','Vendredi','Friday',true),
    ('TIMETABLE_DAY','6','Samedi','Saturday',true),

    ('TIMETABLE_ROOM','Salle 101','Salle 101','Room 101',true),
    ('TIMETABLE_ROOM','Salle 102','Salle 102','Room 102',true),
    ('TIMETABLE_ROOM','Gymnase','Gymnase','Gym',true),
    ('TIMETABLE_ROOM','Salle Info','Salle Info','IT Room',true)
) AS v(category, value, label_fr, label_en, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM public.system_options so
  WHERE so.category = v.category AND so.value = v.value
);

-- =============================================
-- 5. SÉCURISATION DES ANNÉES ACADÉMIQUES
-- =============================================

-- S'assurer que les colonnes de dates existent et sont nullable pour ne pas bloquer TypeORM
ALTER TABLE public.academic_years
    ADD COLUMN IF NOT EXISTS "startDate" DATE,
    ADD COLUMN IF NOT EXISTS "endDate" DATE,
    ADD COLUMN IF NOT EXISTS "isCurrent" BOOLEAN DEFAULT FALSE;

-- Si des années existent déjà sans dates, leur donner des valeurs par défaut non-nulles
UPDATE public.academic_years
SET "startDate" = COALESCE("startDate", DATE '2000-01-01'),
    "endDate"   = COALESCE("endDate",   DATE '2000-12-31'),
    "isCurrent" = COALESCE("isCurrent", FALSE)
WHERE "startDate" IS NULL OR "endDate" IS NULL;

-- =============================================
-- 6. SÉCURISATION DES RÔLES
-- =============================================

ALTER TABLE public.roles
    ADD COLUMN IF NOT EXISTS "name" VARCHAR(255);

-- Donner un nom par défaut aux rôles sans nom pour supprimer les NULL
UPDATE public.roles
SET "name" = COALESCE("name", CONCAT('ROLE_', id::text))
WHERE "name" IS NULL;

-- =============================================
-- 7. SÉCURISATION DES SPÉCIALITÉS
-- =============================================

ALTER TABLE public.specialties
    ADD COLUMN IF NOT EXISTS "name" VARCHAR(255);

-- Donner un nom par défaut aux spécialités sans nom pour supprimer les NULL
UPDATE public.specialties
SET "name" = COALESCE("name", CONCAT('SPECIALTY_', id::text))
WHERE "name" IS NULL;

-- =============================================
-- 8. COLONNES ATTENDUES PAR LES ENTITÉS CORE
-- =============================================

-- Classes : tuitionFee utilisé par l'entité Class
ALTER TABLE public.classes
    ADD COLUMN IF NOT EXISTS "tuitionFee" DECIMAL(10,2) DEFAULT 0;

-- Colonnes relationnelles attendues par l'entité Class
ALTER TABLE public.classes
    ADD COLUMN IF NOT EXISTS academic_year_id INTEGER,
    ADD COLUMN IF NOT EXISTS campus_id INTEGER;

-- Subjects : color + background_color utilisés par l'entité Subject
ALTER TABLE public.subjects
    ADD COLUMN IF NOT EXISTS "color" VARCHAR(50),
    ADD COLUMN IF NOT EXISTS "background_color" VARCHAR(50);

-- Colonnes attendues par l'entité Subject (certaines ne sont pas présentes dans le schéma existant)
ALTER TABLE public.subjects
    ADD COLUMN IF NOT EXISTS coefficient INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS "creditsEcts" INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS class_id INTEGER,
    ADD COLUMN IF NOT EXISTS semester_id INTEGER;

-- =============================================
-- 9. BULLETINS / ÉVALUATIONS / NOTES (Bulletin)
-- =============================================
-- Sécurise la structure attendue pour l'impression des bulletins.

ALTER TABLE public.evaluations
    ADD COLUMN IF NOT EXISTS academic_year_id INTEGER,
    ADD COLUMN IF NOT EXISTS semester_id INTEGER,
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'DRAFT';

ALTER TABLE public.evaluations
    ADD CONSTRAINT IF NOT EXISTS chk_evaluations_type
        CHECK (type IN ('CC', 'SN', 'RA', 'TP', 'PROJET'));

ALTER TABLE public.evaluations
    ADD CONSTRAINT IF NOT EXISTS chk_evaluations_status
        CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED'));

ALTER TABLE public.evaluations
    ADD CONSTRAINT IF NOT EXISTS chk_evaluations_weight_percent
        CHECK (weight_percent > 0 AND weight_percent <= 100);

ALTER TABLE public.evaluations
    ADD CONSTRAINT IF NOT EXISTS chk_evaluations_max_score
        CHECK (max_score > 0);

CREATE INDEX IF NOT EXISTS idx_evaluations_subject ON public.evaluations (subject_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_year_semester ON public.evaluations (academic_year_id, semester_id);

ALTER TABLE public.grades
    ADD COLUMN IF NOT EXISTS anonymity_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

ALTER TABLE public.grades
    ADD CONSTRAINT IF NOT EXISTS chk_grades_score
        CHECK (score IS NULL OR score >= 0);

CREATE INDEX IF NOT EXISTS idx_grades_student ON public.grades (student_id);
CREATE INDEX IF NOT EXISTS idx_grades_evaluation ON public.grades (evaluation_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_grades_anonymity_code
    ON public.grades (anonymity_code)
    WHERE anonymity_code IS NOT NULL;
