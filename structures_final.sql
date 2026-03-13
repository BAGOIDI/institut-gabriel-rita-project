-- ============================================================================
-- SCRIPT SQL COMPLET ET DÉFINITIF - INSTITUT GABRIEL RITA (V3)
-- Ce fichier contient TOUTE la structure de la base de données, 
-- y compris les contraintes de sécurité, l'audit trail, et la gestion des BULLETINS.
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist; -- Nécessaire pour les contraintes de chevauchement d'horaires

-- ============================================================================
-- MODULE 1 : CŒUR DU SYSTÈME (Configuration)
-- ============================================================================
CREATE TABLE public.academic_years (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- Ex: 2023-2024
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE
);

CREATE TABLE public.semesters (
    id SERIAL PRIMARY KEY,
    academic_year_id INTEGER REFERENCES public.academic_years(id),
    name VARCHAR(50) NOT NULL, -- Ex: Semestre 1
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

CREATE TABLE public.tracks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE public.specialties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    track_id INTEGER NOT NULL REFERENCES public.tracks(id)
);

CREATE TABLE public.classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL, -- Ex: L1, L2
    specialty_id INTEGER REFERENCES public.specialties(id),
    capacity INTEGER DEFAULT 50
);

CREATE TABLE public.subjects (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    credits INTEGER NOT NULL,
    specialty_id INTEGER REFERENCES public.specialties(id)
);

-- ============================================================================
-- MODULE 2 : UTILISATEURS ET SÉCURITÉ
-- ============================================================================
CREATE TABLE public.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL -- ADMIN, TEACHER, CASHIER
);

CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES public.roles(id),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE public.system_options (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    value VARCHAR(100) NOT NULL,
    label_fr VARCHAR(255) NOT NULL,
    label_en VARCHAR(255) NOT NULL,
    label VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MODULE 3 : DOSSIER RH : ENSEIGNANTS
-- ============================================================================
CREATE TABLE public.staff (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id),
    matricule VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20),
    date_of_birth DATE,
    place_of_birth VARCHAR(100),
    nationality VARCHAR(50),
    marital_status VARCHAR(50),
    id_card_number VARCHAR(50),
    
    -- Contact
    phone_number VARCHAR(20) NOT NULL, 
    email VARCHAR(100),
    address TEXT,
    emergency_contact VARCHAR(100),
    
    -- Professionnel
    specialty VARCHAR(100),
    diploma VARCHAR(100),
    hire_date DATE,
    contract_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    photo TEXT,
    
    -- Paie & Pointage
    social_security_number VARCHAR(50),
    bank_account VARCHAR(100),
    hourly_rate NUMERIC(10,2) DEFAULT 0.00,
    biometric_id VARCHAR(50) UNIQUE, 
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MODULE 4 : DOSSIER SCOLARITÉ : ÉTUDIANTS
-- ============================================================================
CREATE TABLE public.students (
    id SERIAL PRIMARY KEY,
    matricule VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20),
    date_of_birth DATE,
    
    -- Contact
    phone_number VARCHAR(20),
    email VARCHAR(100),
    parent_phone_number VARCHAR(20),
    
    -- Scolarité
    class_id INTEGER REFERENCES public.classes(id),
    special_status VARCHAR(100), 
    photo TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MODULE 5 : EMPLOIS DU TEMPS (Avec contraintes anti-conflits)
-- ============================================================================
CREATE TABLE public.course_schedules (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES public.staff(id),
    subject_id INTEGER REFERENCES public.subjects(id),
    class_id INTEGER REFERENCES public.classes(id),
    room_name VARCHAR(50),
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    academic_year_id INTEGER REFERENCES public.academic_years(id)
);

-- Contrainte : Empêcher deux cours dans la même salle au même moment
ALTER TABLE public.course_schedules
ADD CONSTRAINT prevent_room_double_booking 
EXCLUDE USING gist (
    room_name WITH =, 
    day_of_week WITH =, 
    timerange(start_time, end_time, '[)') WITH &&
);

-- Contrainte : Empêcher un enseignant d'avoir deux cours au même moment
ALTER TABLE public.course_schedules
ADD CONSTRAINT prevent_staff_double_booking 
EXCLUDE USING gist (
    staff_id WITH =, 
    day_of_week WITH =, 
    timerange(start_time, end_time, '[)') WITH &&
);

-- ============================================================================
-- MODULE 6 : PRÉSENCES (K40) ET NOTIFICATIONS WHATSAPP
-- ============================================================================
CREATE TABLE public.attendance_device_logs (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50),
    biometric_id VARCHAR(50),
    punch_time TIMESTAMP NOT NULL,
    punch_type VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.attendance_records (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES public.staff(id),
    schedule_id INTEGER REFERENCES public.course_schedules(id),
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL, -- PRESENT, LATE, ABSENT
    delay_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.whatsapp_notifications (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES public.staff(id),
    message_type VARCHAR(50),
    message_content TEXT,
    status VARCHAR(20) DEFAULT 'SENT',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MODULE 7 : FINANCES (Paiements & Moratoires)
-- ============================================================================
CREATE TABLE public.finance_fee_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    academic_year_id INTEGER REFERENCES public.academic_years(id)
);

CREATE TABLE public.finance_student_fees (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES public.students(id),
    fee_type_id INTEGER REFERENCES public.finance_fee_types(id),
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    total_due NUMERIC(10, 2) NOT NULL,
    is_fully_paid BOOLEAN DEFAULT FALSE
);

CREATE TABLE public.finance_payments (
    id SERIAL PRIMARY KEY,
    student_fee_id INTEGER REFERENCES public.finance_student_fees(id),
    amount_paid NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    receipt_number VARCHAR(50) UNIQUE,
    recorded_by INTEGER REFERENCES public.users(id),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.finance_payment_plans (
    id SERIAL PRIMARY KEY,
    student_fee_id INTEGER REFERENCES public.finance_student_fees(id),
    due_date DATE NOT NULL,
    amount_expected NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    notes TEXT
);

-- ============================================================================
-- MODULE 8 : SALAIRES
-- ============================================================================
CREATE TABLE public.payroll_slips (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES public.staff(id),
    month VARCHAR(10) NOT NULL,
    base_salary NUMERIC(10, 2) NOT NULL,
    hourly_rate NUMERIC(10, 2) NOT NULL,
    hours_worked NUMERIC(10, 2) NOT NULL,
    delay_penalties NUMERIC(10, 2) DEFAULT 0,
    net_salary NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, month)
);

-- ============================================================================
-- MODULE 9 : ÉVALUATIONS ET BULLETINS DE NOTES
-- ============================================================================
CREATE TABLE public.evaluations (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES public.subjects(id),
    academic_year_id INTEGER REFERENCES public.academic_years(id),
    semester_id INTEGER REFERENCES public.semesters(id),
    name VARCHAR(255) NOT NULL, -- Ex: "Examen Final"
    type VARCHAR(50) NOT NULL, -- Ex: "CC", "SN"
    weight_percent INTEGER DEFAULT 100,
    max_score NUMERIC(5,2) DEFAULT 20.00,
    date DATE
);

CREATE TABLE public.grades (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES public.students(id),
    evaluation_id INTEGER REFERENCES public.evaluations(id),
    score NUMERIC(5,2),
    is_absent BOOLEAN DEFAULT FALSE,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, evaluation_id)
);

CREATE TABLE public.bulletins (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES public.students(id),
    academic_year_id INTEGER REFERENCES public.academic_years(id),
    semester_id INTEGER REFERENCES public.semesters(id),
    total_credits_attempted INTEGER,
    total_credits_earned INTEGER,
    gpa NUMERIC(5,2),
    decision VARCHAR(100),
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, academic_year_id, semester_id)
);

-- ============================================================================
-- MODULE 10 : DISCIPLINE ET DOCUMENTS (Optionnel mais présent dans l'ancien système)
-- ============================================================================
CREATE TABLE public.disciplinary_actions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES public.students(id),
    action_type VARCHAR(100) NOT NULL, -- Avertissement, Blâme, Exclusion
    reason TEXT NOT NULL,
    date DATE NOT NULL,
    issued_by INTEGER REFERENCES public.users(id)
);

CREATE TABLE public.official_documents (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES public.students(id),
    document_type VARCHAR(100) NOT NULL, -- Certificat de scolarité, Relevé de notes
    file_url TEXT,
    issued_date DATE DEFAULT CURRENT_DATE
);

-- ============================================================================
-- MODULE 11 : AUDIT TRAIL (Traçabilité Anti-Fraude)
-- ============================================================================
CREATE TABLE public.audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(10) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by INTEGER,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION log_finance_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD));
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_finance_payments
AFTER INSERT OR UPDATE OR DELETE ON public.finance_payments
FOR EACH ROW EXECUTE FUNCTION log_finance_changes();

CREATE TRIGGER audit_finance_plans
AFTER INSERT OR UPDATE OR DELETE ON public.finance_payment_plans
FOR EACH ROW EXECUTE FUNCTION log_finance_changes();

CREATE TRIGGER audit_finance_fees
AFTER INSERT OR UPDATE OR DELETE ON public.finance_student_fees
FOR EACH ROW EXECUTE FUNCTION log_finance_changes();

-- ============================================================================
-- INDEX DE PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_students_matricule ON public.students(matricule);
CREATE INDEX IF NOT EXISTS idx_staff_biometric_id ON public.staff(biometric_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_finance_student_fees ON public.finance_student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON public.grades(student_id);
