
-- Ensure tables exist (they should be created by TypeORM, but just in case)
CREATE TABLE IF NOT EXISTS public.evaluations (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER NOT NULL,
    academic_year_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    weight_percent INTEGER DEFAULT 100,
    max_score NUMERIC(5, 2) DEFAULT 20.00,
    date DATE,
    status VARCHAR(20) DEFAULT 'DRAFT'
);

CREATE TABLE IF NOT EXISTS public.grades (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    evaluation_id INTEGER NOT NULL,
    anonymity_code VARCHAR(50),
    score NUMERIC(5, 2),
    is_absent BOOLEAN DEFAULT FALSE,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100)
);

-- Crucial for upsert: unique index on (student_id, evaluation_id)
DROP INDEX IF EXISTS public.uq_grades_student_eval;
CREATE UNIQUE INDEX uq_grades_student_eval ON public.grades (student_id, evaluation_id);

-- Ensure anonymity_code is unique if not null
DROP INDEX IF EXISTS public.uq_grades_anonymity;
CREATE UNIQUE INDEX uq_grades_anonymity ON public.grades (anonymity_code) WHERE anonymity_code IS NOT NULL;
