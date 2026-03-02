
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
