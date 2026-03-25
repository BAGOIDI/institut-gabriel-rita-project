-- Staff
ALTER TABLE public.staff ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE public.staff ALTER COLUMN phone_number DROP NOT NULL;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR(100);
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50);
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS id_card_number VARCHAR(50);
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS specialty VARCHAR(100);
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS diploma VARCHAR(100);
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS contract_type VARCHAR(50);
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS photo TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS social_security_number VARCHAR(50);
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS bank_account VARCHAR(100);
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS biometric_id VARCHAR(50);
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Subjects
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS class_id INTEGER;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS teacher_id INTEGER;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS background_color VARCHAR(50);
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS coefficient INTEGER DEFAULT 1;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS "creditsEcts" INTEGER DEFAULT 0;

-- Specialties
ALTER TABLE public.specialties ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE public.specialties ADD COLUMN IF NOT EXISTS description TEXT;

-- Teacher Subject Class
ALTER TABLE public.teacher_subject_class ADD COLUMN IF NOT EXISTS semester_id INTEGER;
ALTER TABLE public.teacher_subject_class ADD COLUMN IF NOT EXISTS cota_minsup INTEGER;
ALTER TABLE public.teacher_subject_class ADD COLUMN IF NOT EXISTS cota_isgr INTEGER;
ALTER TABLE public.teacher_subject_class ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2);
ALTER TABLE public.teacher_subject_class ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Semesters
ALTER TABLE public.semesters ADD COLUMN IF NOT EXISTS academic_year_id INTEGER;
ALTER TABLE public.semesters ADD COLUMN IF NOT EXISTS "startDate" DATE;
ALTER TABLE public.semesters ADD COLUMN IF NOT EXISTS "endDate" DATE;

-- Students
ALTER TABLE public.students ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_phone_number VARCHAR(20);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS special_status VARCHAR(100);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS photo TEXT;
