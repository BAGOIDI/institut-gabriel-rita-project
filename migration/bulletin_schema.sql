BEGIN;

ALTER TABLE public.evaluations
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'DRAFT';

ALTER TABLE public.grades
  ADD COLUMN IF NOT EXISTS anonymity_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_evaluations_type') THEN
    ALTER TABLE public.evaluations
      ADD CONSTRAINT chk_evaluations_type CHECK (type IN ('CC','SN','RA','TP','PROJET'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_evaluations_status') THEN
    ALTER TABLE public.evaluations
      ADD CONSTRAINT chk_evaluations_status CHECK (status IN ('DRAFT','PUBLISHED','CLOSED'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_evaluations_weight_percent') THEN
    ALTER TABLE public.evaluations
      ADD CONSTRAINT chk_evaluations_weight_percent CHECK (weight_percent > 0 AND weight_percent <= 100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_evaluations_max_score') THEN
    ALTER TABLE public.evaluations
      ADD CONSTRAINT chk_evaluations_max_score CHECK (max_score > 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_grades_score') THEN
    ALTER TABLE public.grades
      ADD CONSTRAINT chk_grades_score CHECK (score IS NULL OR score >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_evaluations_subject ON public.evaluations (subject_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_year_semester ON public.evaluations (academic_year_id, semester_id);

CREATE INDEX IF NOT EXISTS idx_grades_student ON public.grades (student_id);
CREATE INDEX IF NOT EXISTS idx_grades_evaluation ON public.grades (evaluation_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_grades_anonymity_code
  ON public.grades (anonymity_code)
  WHERE anonymity_code IS NOT NULL;

COMMIT;

