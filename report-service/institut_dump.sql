
-- ==================================================================================
-- INSTITUT GABRIEL RITA - ERP DEFINITIVE EDITION (FIXED)
-- ==================================================================================
-- Compatible: PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------------
-- 0. CLEANUP
-- ----------------------------------------------------------------------------------
DROP VIEW IF EXISTS public.student_transcripts_view CASCADE;
DROP TABLE IF EXISTS public.official_documents CASCADE;
DROP TABLE IF EXISTS public.student_submissions CASCADE;
DROP TABLE IF EXISTS public.online_assignments CASCADE;
DROP TABLE IF EXISTS public.course_materials CASCADE;
DROP TABLE IF EXISTS public.cafeteria_transactions CASCADE;
DROP TABLE IF EXISTS public.cafeteria_items CASCADE;
DROP TABLE IF EXISTS public.internships CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.disciplinary_actions CASCADE;
DROP TABLE IF EXISTS public.housing_allocations CASCADE;
DROP TABLE IF EXISTS public.housing_rooms CASCADE;
DROP TABLE IF EXISTS public.housing_buildings CASCADE;
DROP TABLE IF EXISTS public.medical_visits CASCADE;
DROP TABLE IF EXISTS public.book_loans CASCADE;
DROP TABLE IF EXISTS public.books CASCADE;
DROP TABLE IF EXISTS public.transport_subscriptions CASCADE;
DROP TABLE IF EXISTS public.transport_stops CASCADE;
DROP TABLE IF EXISTS public.transport_routes CASCADE;
DROP TABLE IF EXISTS public.course_sessions CASCADE;
DROP TABLE IF EXISTS public.course_schedule CASCADE;
DROP TABLE IF EXISTS public.grades CASCADE;
DROP TABLE IF EXISTS public.evaluations CASCADE;
DROP TABLE IF EXISTS public.teacher_evaluations CASCADE;
DROP TABLE IF EXISTS public.final_projects CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.staff CASCADE;
DROP TABLE IF EXISTS public.exam_results CASCADE;
DROP TABLE IF EXISTS public.entrance_exams CASCADE;
DROP TABLE IF EXISTS public.prospects CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.specialties CASCADE;
DROP TABLE IF EXISTS public.semesters CASCADE;
DROP TABLE IF EXISTS public.academic_years CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.campuses CASCADE;

-- ----------------------------------------------------------------------------------
-- 1. IAM & INFRASTRUCTURE
-- ----------------------------------------------------------------------------------

CREATE TABLE public.campuses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar NOT NULL,
    city varchar,
    address text,
    is_active boolean DEFAULT true
);

CREATE TABLE public.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar NOT NULL UNIQUE,
    permissions jsonb,
    description text
);

CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username varchar UNIQUE NOT NULL,
    password_hash varchar NOT NULL,
    email varchar UNIQUE,
    role_id uuid REFERENCES public.roles(id),
    campus_id uuid REFERENCES public.campuses(id),
    last_login timestamp,
    is_active boolean DEFAULT true,
    created_at timestamp DEFAULT now()
);

CREATE TABLE public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id),
    action varchar NOT NULL,
    table_name varchar,
    record_id uuid,
    details jsonb,
    ip_address varchar,
    created_at timestamp DEFAULT now()
);

-- ----------------------------------------------------------------------------------
-- 2. ACADEMIC STRUCTURE
-- ----------------------------------------------------------------------------------

CREATE TABLE public.academic_years (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_current boolean DEFAULT false
);

CREATE TABLE public.semesters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar NOT NULL,
    academic_year_id uuid REFERENCES public.academic_years(id),
    start_date date,
    end_date date
);

CREATE TABLE public.specialties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar NOT NULL,
    domain varchar,
    code varchar
);

CREATE TABLE public.classes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar NOT NULL,
    specialty_id uuid REFERENCES public.specialties(id),
    academic_year_id uuid REFERENCES public.academic_years(id),
    campus_id uuid REFERENCES public.campuses(id),
    tuition_fee numeric(10,2) DEFAULT 0
);

CREATE TABLE public.subjects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar NOT NULL,
    code varchar,
    class_id uuid REFERENCES public.classes(id),
    semester_id uuid REFERENCES public.semesters(id),
    coefficient integer DEFAULT 1,
    credits_ects integer DEFAULT 0
);

-- ----------------------------------------------------------------------------------
-- 3. CRM & ADMISSIONS
-- ----------------------------------------------------------------------------------

CREATE TABLE public.prospects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name varchar NOT NULL,
    last_name varchar NOT NULL,
    phone varchar,
    interested_specialty_id uuid REFERENCES public.specialties(id),
    status varchar DEFAULT 'NEW',
    created_at timestamp DEFAULT now()
);

CREATE TABLE public.entrance_exams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar,
    date date,
    campus_id uuid REFERENCES public.campuses(id)
);

CREATE TABLE public.exam_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id uuid REFERENCES public.prospects(id),
    exam_id uuid REFERENCES public.entrance_exams(id),
    score numeric(5,2),
    is_admitted boolean DEFAULT false
);

-- ----------------------------------------------------------------------------------
-- 4. HR & STAFF
-- ----------------------------------------------------------------------------------

CREATE TABLE public.staff (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id),
    first_name varchar NOT NULL,
    last_name varchar NOT NULL,
    biometric_id varchar UNIQUE,
    job_title varchar,
    hourly_rate numeric(10,2),
    phone varchar,
    email varchar,
    campus_id uuid REFERENCES public.campuses(id)
);

CREATE TABLE public.attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id uuid REFERENCES public.staff(id),
    check_in timestamp,
    check_out timestamp,
    date date NOT NULL,
    status varchar
);

-- ----------------------------------------------------------------------------------
-- 5. STUDENT MANAGEMENT & FINANCE
-- ----------------------------------------------------------------------------------

CREATE TABLE public.students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id),
    matricule varchar UNIQUE NOT NULL,
    first_name varchar NOT NULL,
    last_name varchar NOT NULL,
    class_id uuid REFERENCES public.classes(id),
    date_of_birth date,
    gender varchar(1),
    phone varchar,
    parent_phone varchar,
    balance numeric(10,2) DEFAULT 0,
    photo_url text,
    is_active boolean DEFAULT true
);

CREATE TABLE public.invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid REFERENCES public.students(id),
    title varchar,
    amount numeric(10,2) NOT NULL,
    due_date date,
    status varchar DEFAULT 'UNPAID'
);

CREATE TABLE public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid REFERENCES public.students(id),
    invoice_id uuid REFERENCES public.invoices(id),
    amount numeric(10,2) NOT NULL,
    method varchar,
    reference varchar,
    payment_date timestamp DEFAULT now()
);

-- ----------------------------------------------------------------------------------
-- 6. PEDAGOGY: SCHEDULE, GRADES & LMS
-- ----------------------------------------------------------------------------------

CREATE TABLE public.course_schedule (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id uuid REFERENCES public.classes(id),
    subject_id uuid REFERENCES public.subjects(id),
    teacher_id uuid REFERENCES public.staff(id),
    day_of_week integer CHECK (day_of_week BETWEEN 1 AND 7),
    start_time time NOT NULL,
    end_time time NOT NULL,
    room varchar,
    is_active boolean DEFAULT true
);

CREATE TABLE public.course_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id uuid REFERENCES public.course_schedule(id),
    subject_id uuid REFERENCES public.subjects(id),
    teacher_id uuid REFERENCES public.staff(id),
    date date NOT NULL,
    start_time time,
    end_time time,
    topic_taught text,
    is_validated boolean DEFAULT false
);

CREATE TABLE public.evaluations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id uuid REFERENCES public.subjects(id),
    name varchar NOT NULL,
    type varchar NOT NULL,
    weight_percent integer DEFAULT 100,
    max_score numeric(5,2) DEFAULT 20,
    date date
);

CREATE TABLE public.grades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid REFERENCES public.students(id),
    evaluation_id uuid REFERENCES public.evaluations(id),
    score numeric(5,2),
    is_absent boolean DEFAULT false,
    comments text
);

CREATE TABLE public.course_materials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id uuid REFERENCES public.subjects(id),
    title varchar,
    file_url text,
    uploaded_at timestamp DEFAULT now()
);

CREATE TABLE public.online_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id uuid REFERENCES public.subjects(id),
    title varchar,
    due_date timestamp
);

CREATE TABLE public.student_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id uuid REFERENCES public.online_assignments(id),
    student_id uuid REFERENCES public.students(id),
    file_url text,
    submitted_at timestamp DEFAULT now(),
    grade numeric(5,2)
);

-- ----------------------------------------------------------------------------------
-- 7. PERIPHERAL MODULES
-- ----------------------------------------------------------------------------------

CREATE TABLE public.transport_routes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar, monthly_fee numeric);
CREATE TABLE public.transport_stops (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), route_id uuid REFERENCES public.transport_routes(id), name varchar, pickup_time time);
CREATE TABLE public.transport_subscriptions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid REFERENCES public.students(id), route_id uuid REFERENCES public.transport_routes(id), start_date date, is_active boolean DEFAULT true);

CREATE TABLE public.books (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title varchar, author varchar, isbn varchar, total_copies integer);
CREATE TABLE public.book_loans (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), book_id uuid REFERENCES public.books(id), student_id uuid REFERENCES public.students(id), loan_date date, due_date date, return_date date);

CREATE TABLE public.medical_visits (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid REFERENCES public.students(id), visit_date timestamp, diagnosis text, treatment text, is_confidential boolean DEFAULT true);

CREATE TABLE public.housing_buildings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar, campus_id uuid REFERENCES public.campuses(id));
CREATE TABLE public.housing_rooms (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), building_id uuid REFERENCES public.housing_buildings(id), room_number varchar, monthly_rent numeric);
CREATE TABLE public.housing_allocations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid REFERENCES public.students(id), room_id uuid REFERENCES public.housing_rooms(id), start_date date, end_date date);

CREATE TABLE public.disciplinary_actions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid REFERENCES public.students(id), incident_date date, infraction_type varchar, sanction varchar, status varchar);

CREATE TABLE public.companies (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar, industry varchar, is_partner boolean);
CREATE TABLE public.internships (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid REFERENCES public.students(id), company_id uuid REFERENCES public.companies(id), start_date date, end_date date, topic text, status varchar);

CREATE TABLE public.cafeteria_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar, price numeric);
CREATE TABLE public.cafeteria_transactions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid REFERENCES public.students(id), item_id uuid REFERENCES public.cafeteria_items(id), quantity integer, total_amount numeric, transaction_date timestamp DEFAULT now());

CREATE TABLE public.official_documents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid REFERENCES public.students(id), type varchar, file_path text, verification_hash varchar, generated_at timestamp DEFAULT now());

CREATE TABLE public.final_projects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title varchar, student_id uuid REFERENCES public.students(id), supervisor_id uuid REFERENCES public.staff(id), status varchar);

CREATE TABLE public.teacher_evaluations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid REFERENCES public.students(id), staff_id uuid REFERENCES public.staff(id), rating integer, comments text);

-- ----------------------------------------------------------------------------------
-- 8. VIEWS
-- ----------------------------------------------------------------------------------

CREATE VIEW public.student_transcripts_view AS
SELECT
    s.id as student_id,
    s.matricule,
    s.first_name,
    s.last_name,
    sub.id as subject_id,
    sub.name as subject_name,
    sub.credits_ects,
    COALESCE(AVG(CASE WHEN e.type = 'CC' THEN g.score END), 0) as avg_cc,
    COALESCE(MAX(CASE WHEN e.type = 'EXAM' THEN g.score END), 0) as exam_score,
    MAX(CASE WHEN e.type = 'RATCH' THEN g.score END) as resit_score,
    CAST(
        (COALESCE(AVG(CASE WHEN e.type = 'CC' THEN g.score END), 0) * 0.3) +
        (COALESCE(GREATEST(MAX(CASE WHEN e.type = 'EXAM' THEN g.score END), MAX(CASE WHEN e.type = 'RATCH' THEN g.score END)), 0) * 0.7)
    AS numeric(5,2)) as final_average,
    CASE
        WHEN ((COALESCE(AVG(CASE WHEN e.type = 'CC' THEN g.score END), 0) * 0.3) + (COALESCE(GREATEST(MAX(CASE WHEN e.type = 'EXAM' THEN g.score END), MAX(CASE WHEN e.type = 'RATCH' THEN g.score END)), 0) * 0.7)) >= 10 THEN 'VALIDATED'
        ELSE 'FAILED'
    END as status
FROM students s
JOIN classes c ON s.class_id = c.id
JOIN subjects sub ON sub.class_id = c.id
LEFT JOIN evaluations e ON e.subject_id = sub.id
LEFT JOIN grades g ON g.evaluation_id = e.id AND g.student_id = s.id
GROUP BY s.id, sub.id;

-- ==========================================
-- 9. DATA INJECTION (FIXED)
-- ==========================================
INSERT INTO public.campuses (id, name, city) VALUES ('18533d6c-b880-48c4-b413-028a57179df9', 'Campus Yassa', 'Douala');
INSERT INTO public.campuses (id, name, city) VALUES ('66d33ead-07b8-46d6-8589-e6a3a9f80b19', 'Campus Principal', 'Douala');
INSERT INTO public.academic_years (id, name, start_date, end_date, is_current) VALUES ('a926a721-b73a-4272-8be7-d0ee7164a146', '2026-2027', '2026-09-01', '2027-06-30', true);
INSERT INTO public.semesters (id, name, academic_year_id, start_date, end_date) VALUES ('f0abd1db-8572-4b17-92b7-1c8c08497a3e', 'Semestre 1', 'a926a721-b73a-4272-8be7-d0ee7164a146', '2026-09-01', '2027-01-31');
INSERT INTO public.specialties (id, name, domain) VALUES ('968f4fcf-e878-48ae-823f-92591a2d17b4', 'Génie Logiciel', 'Industriel');
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('547c9515-b8b5-49bb-9ac8-81c9b487e897', 'BTS 1 - Génie Logiciel', '968f4fcf-e878-48ae-823f-92591a2d17b4', '18533d6c-b880-48c4-b413-028a57179df9', 350000);
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('d5ee6ba4-3eef-41a9-ab7e-add4f52d87dd', 'BTS 2 - Génie Logiciel', '968f4fcf-e878-48ae-823f-92591a2d17b4', '66d33ead-07b8-46d6-8589-e6a3a9f80b19', 500000);
INSERT INTO public.specialties (id, name, domain) VALUES ('bb7224b4-9282-4d0c-8e33-7530c4346109', 'Réseaux et Sécurité', 'Industriel');
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('ad445210-88c1-4984-8b02-424f232368a2', 'BTS 1 - Réseaux et Sécurité', 'bb7224b4-9282-4d0c-8e33-7530c4346109', '66d33ead-07b8-46d6-8589-e6a3a9f80b19', 350000);
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('6f8d8763-ac46-43b9-a815-66dc8528b5da', 'Master 2 - Réseaux et Sécurité', 'bb7224b4-9282-4d0c-8e33-7530c4346109', '18533d6c-b880-48c4-b413-028a57179df9', 500000);
INSERT INTO public.specialties (id, name, domain) VALUES ('66e42c51-a1ec-4e66-bef1-a9de8a412350', 'Télécommunications', 'Industriel');
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('55a3fa8c-bdde-43fc-b6f1-dfdf3d71b53e', 'Licence 1 - Télécommunications', '66e42c51-a1ec-4e66-bef1-a9de8a412350', '66d33ead-07b8-46d6-8589-e6a3a9f80b19', 500000);
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('1e354c22-4c74-4815-916b-163738a82607', 'Licence 2 - Télécommunications', '66e42c51-a1ec-4e66-bef1-a9de8a412350', '18533d6c-b880-48c4-b413-028a57179df9', 350000);
INSERT INTO public.specialties (id, name, domain) VALUES ('d0a912d3-acf6-4ec1-89e5-56f40968a1e9', 'Génie Civil', 'Industriel');
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('4999211a-32fa-4cb5-a00f-65449095a735', 'Master 1 - Génie Civil', 'd0a912d3-acf6-4ec1-89e5-56f40968a1e9', '66d33ead-07b8-46d6-8589-e6a3a9f80b19', 400000);
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('baf5eab2-daec-4c64-91b6-a53505edddc6', 'Licence 2 - Génie Civil', 'd0a912d3-acf6-4ec1-89e5-56f40968a1e9', '18533d6c-b880-48c4-b413-028a57179df9', 500000);
INSERT INTO public.specialties (id, name, domain) VALUES ('09965d2c-187c-4480-b33c-6e4889d5734d', 'Électrotechnique', 'Industriel');
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('90517b65-e9c3-4767-942d-22b13a1fb6cf', 'Master 1 - Électrotechnique', '09965d2c-187c-4480-b33c-6e4889d5734d', '18533d6c-b880-48c4-b413-028a57179df9', 500000);
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('3eaa62df-e3ad-4759-bd31-cd2f68b258f7', 'Licence 2 - Électrotechnique', '09965d2c-187c-4480-b33c-6e4889d5734d', '66d33ead-07b8-46d6-8589-e6a3a9f80b19', 500000);
INSERT INTO public.specialties (id, name, domain) VALUES ('5cb0373c-025e-4f6a-9d87-985abc2a1a4e', 'Comptabilité (CGE)', 'Gestion');
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('6c0586f9-9576-49c5-a80a-f516416ed33a', 'BTS 1 - Comptabilité (CGE)', '5cb0373c-025e-4f6a-9d87-985abc2a1a4e', '66d33ead-07b8-46d6-8589-e6a3a9f80b19', 500000);
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('d1c47bdb-16b1-4b1c-884f-69eacfedbcd2', 'BTS 2 - Comptabilité (CGE)', '5cb0373c-025e-4f6a-9d87-985abc2a1a4e', '18533d6c-b880-48c4-b413-028a57179df9', 500000);
INSERT INTO public.specialties (id, name, domain) VALUES ('51e74d69-9fb6-4a36-819a-37bc2181b1e4', 'Ressources Humaines', 'Gestion');
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('7d0b2c73-1acc-43ad-bdd4-df8c7a0f03ac', 'Master 1 - Ressources Humaines', '51e74d69-9fb6-4a36-819a-37bc2181b1e4', '66d33ead-07b8-46d6-8589-e6a3a9f80b19', 350000);
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('597e3d40-413e-42ab-b046-433e996a311a', 'Licence 2 - Ressources Humaines', '51e74d69-9fb6-4a36-819a-37bc2181b1e4', '66d33ead-07b8-46d6-8589-e6a3a9f80b19', 400000);
INSERT INTO public.specialties (id, name, domain) VALUES ('3ca5b692-5659-4de7-84ec-d509c772bd42', 'Logistique', 'Gestion');
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('adc4f9d8-b311-4a20-90c8-361c2b39eb28', 'Licence 1 - Logistique', '3ca5b692-5659-4de7-84ec-d509c772bd42', '18533d6c-b880-48c4-b413-028a57179df9', 350000);
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('4a39536f-125a-4951-a384-c8fb8193bccd', 'Licence 2 - Logistique', '3ca5b692-5659-4de7-84ec-d509c772bd42', '18533d6c-b880-48c4-b413-028a57179df9', 400000);
INSERT INTO public.specialties (id, name, domain) VALUES ('960e1ccc-9f48-479a-ad92-92bedd0bba2b', 'Banque et Finance', 'Gestion');
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('dde091e1-dd25-4068-9594-c982536c509f', 'BTS 1 - Banque et Finance', '960e1ccc-9f48-479a-ad92-92bedd0bba2b', '18533d6c-b880-48c4-b413-028a57179df9', 500000);
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('6dfbfaeb-39de-41a5-99f9-2ae659b136d8', 'Licence 2 - Banque et Finance', '960e1ccc-9f48-479a-ad92-92bedd0bba2b', '18533d6c-b880-48c4-b413-028a57179df9', 400000);
INSERT INTO public.specialties (id, name, domain) VALUES ('de85caa4-b5c2-4c21-baf5-938a37704bd5', 'Marketing', 'Gestion');
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('286053a4-ff6d-4d65-a480-404ded33529a', 'Master 1 - Marketing', 'de85caa4-b5c2-4c21-baf5-938a37704bd5', '66d33ead-07b8-46d6-8589-e6a3a9f80b19', 500000);
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('a4e7268c-0f3c-4883-b42e-3cc31175d8ea', 'BTS 2 - Marketing', 'de85caa4-b5c2-4c21-baf5-938a37704bd5', '18533d6c-b880-48c4-b413-028a57179df9', 400000);
INSERT INTO public.specialties (id, name, domain) VALUES ('612b3979-3002-4925-b1ed-0dd3e76381e8', 'Sciences Infirmières', 'Santé');
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('e365076d-c200-4f66-a775-36bcf2b51c58', 'Licence 1 - Sciences Infirmières', '612b3979-3002-4925-b1ed-0dd3e76381e8', '66d33ead-07b8-46d6-8589-e6a3a9f80b19', 350000);
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('d934f3af-7005-4440-8fe1-c48418fe6860', 'BTS 2 - Sciences Infirmières', '612b3979-3002-4925-b1ed-0dd3e76381e8', '18533d6c-b880-48c4-b413-028a57179df9', 400000);
INSERT INTO public.specialties (id, name, domain) VALUES ('6acef0fd-dc01-489a-a9c4-52a8d2f7fa41', 'Sage-femme', 'Santé');
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('7dd6de0a-7116-4758-974d-99c4b52e7269', 'Licence 1 - Sage-femme', '6acef0fd-dc01-489a-a9c4-52a8d2f7fa41', '66d33ead-07b8-46d6-8589-e6a3a9f80b19', 400000);
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('76dbbfb6-62fa-4632-ba22-98fdc784f4dc', 'Master 2 - Sage-femme', '6acef0fd-dc01-489a-a9c4-52a8d2f7fa41', '66d33ead-07b8-46d6-8589-e6a3a9f80b19', 350000);
INSERT INTO public.specialties (id, name, domain) VALUES ('c7dbb88b-1f02-4644-8f23-05eef559289d', 'Techniques de Laboratoire', 'Santé');
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('abffd3c7-a697-4d22-849f-d061c860cd89', 'Licence 1 - Techniques de Laboratoire', 'c7dbb88b-1f02-4644-8f23-05eef559289d', '66d33ead-07b8-46d6-8589-e6a3a9f80b19', 500000);
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('1f468e82-b8b7-4166-8289-993839c8fb58', 'Master 2 - Techniques de Laboratoire', 'c7dbb88b-1f02-4644-8f23-05eef559289d', '18533d6c-b880-48c4-b413-028a57179df9', 500000);
INSERT INTO public.specialties (id, name, domain) VALUES ('494ae02c-9352-492a-a96f-b2f8d2d12289', 'Droit des Affaires', 'Juridique');
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('373f54ce-946e-4f2b-8ce3-0a8371de8843', 'BTS 1 - Droit des Affaires', '494ae02c-9352-492a-a96f-b2f8d2d12289', '66d33ead-07b8-46d6-8589-e6a3a9f80b19', 400000);
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('2411b310-c13b-4003-91d3-9d6081835f49', 'BTS 2 - Droit des Affaires', '494ae02c-9352-492a-a96f-b2f8d2d12289', '66d33ead-07b8-46d6-8589-e6a3a9f80b19', 500000);
INSERT INTO public.specialties (id, name, domain) VALUES ('2639901e-2567-47e5-b4dc-5ef1b72ce0ae', 'Douane et Transit', 'Juridique');
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('46020607-9c2e-412b-a6a4-fdc4aedb38b4', 'Licence 1 - Douane et Transit', '2639901e-2567-47e5-b4dc-5ef1b72ce0ae', '18533d6c-b880-48c4-b413-028a57179df9', 350000);
INSERT INTO public.classes (id, name, specialty_id, campus_id, tuition_fee) VALUES ('ee1c9055-87ad-4699-a1dd-cb92e11f2bea', 'Licence 2 - Douane et Transit', '2639901e-2567-47e5-b4dc-5ef1b72ce0ae', '66d33ead-07b8-46d6-8589-e6a3a9f80b19', 350000);
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('1671da17-fae2-497b-86ba-76dfd1d3a9f1', 'Boris', 'Onana', '1', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('1671da17-fae2-497b-86ba-76dfd1d3a9f1', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('1671da17-fae2-497b-86ba-76dfd1d3a9f1', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('1671da17-fae2-497b-86ba-76dfd1d3a9f1', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('3276b4c4-adc0-4696-93d7-b9b168227fcf', 'Kevin', 'Matip', '2', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('3276b4c4-adc0-4696-93d7-b9b168227fcf', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('3276b4c4-adc0-4696-93d7-b9b168227fcf', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('3276b4c4-adc0-4696-93d7-b9b168227fcf', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('697eaa16-6ad1-4e3a-842e-5be314854798', 'Marie', 'Ngannou', '3', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('697eaa16-6ad1-4e3a-842e-5be314854798', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('697eaa16-6ad1-4e3a-842e-5be314854798', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('697eaa16-6ad1-4e3a-842e-5be314854798', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('7b0c0bf2-f6fc-4c48-b48a-0d6553dc844e', 'Junior', 'Nguema', '4', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('7b0c0bf2-f6fc-4c48-b48a-0d6553dc844e', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('7b0c0bf2-f6fc-4c48-b48a-0d6553dc844e', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('7b0c0bf2-f6fc-4c48-b48a-0d6553dc844e', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('e18cf02c-44d1-46ba-aac5-e07c30d37cf5', 'Landry', 'Song', '5', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('e18cf02c-44d1-46ba-aac5-e07c30d37cf5', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('e18cf02c-44d1-46ba-aac5-e07c30d37cf5', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('e18cf02c-44d1-46ba-aac5-e07c30d37cf5', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('3e152530-e753-43a8-9c30-d013e40bc781', 'Pierre', 'Nguema', '6', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('3e152530-e753-43a8-9c30-d013e40bc781', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('3e152530-e753-43a8-9c30-d013e40bc781', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('3e152530-e753-43a8-9c30-d013e40bc781', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('12bdcd3d-4360-46bf-9b0b-8b11abbc13ab', 'Pierre', 'Matip', '7', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('12bdcd3d-4360-46bf-9b0b-8b11abbc13ab', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('12bdcd3d-4360-46bf-9b0b-8b11abbc13ab', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('12bdcd3d-4360-46bf-9b0b-8b11abbc13ab', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('ee05ed00-6f0c-4415-9a78-6efef7ef43ae', 'Jean', 'Nguema', '8', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('ee05ed00-6f0c-4415-9a78-6efef7ef43ae', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('ee05ed00-6f0c-4415-9a78-6efef7ef43ae', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('ee05ed00-6f0c-4415-9a78-6efef7ef43ae', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('2a82c680-0c2f-4cbc-9edc-1fc1ef6dbb0d', 'Junior', 'Milla', '9', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('2a82c680-0c2f-4cbc-9edc-1fc1ef6dbb0d', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('2a82c680-0c2f-4cbc-9edc-1fc1ef6dbb0d', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('2a82c680-0c2f-4cbc-9edc-1fc1ef6dbb0d', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('677e1e0f-ad73-40a7-9fbe-f6700df49b3d', 'Vanessa', 'Milla', '10', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('677e1e0f-ad73-40a7-9fbe-f6700df49b3d', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('677e1e0f-ad73-40a7-9fbe-f6700df49b3d', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('677e1e0f-ad73-40a7-9fbe-f6700df49b3d', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('df21916c-568e-432e-aa42-49a461844c4b', 'Esther', 'Milla', '11', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('df21916c-568e-432e-aa42-49a461844c4b', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('df21916c-568e-432e-aa42-49a461844c4b', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('df21916c-568e-432e-aa42-49a461844c4b', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('b9e96d78-98d3-4b49-8158-5e5bfe580bbd', 'Sandrine', 'Nguema', '12', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('b9e96d78-98d3-4b49-8158-5e5bfe580bbd', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('b9e96d78-98d3-4b49-8158-5e5bfe580bbd', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('b9e96d78-98d3-4b49-8158-5e5bfe580bbd', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('98c08825-8cf3-462d-91fb-2f9cdeaa326b', 'Kevin', 'Matip', '13', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('98c08825-8cf3-462d-91fb-2f9cdeaa326b', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('98c08825-8cf3-462d-91fb-2f9cdeaa326b', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('98c08825-8cf3-462d-91fb-2f9cdeaa326b', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('b138c3c4-0896-4c9a-98b0-4c039da6457d', 'Pierre', 'Aboubakar', '14', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('b138c3c4-0896-4c9a-98b0-4c039da6457d', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('b138c3c4-0896-4c9a-98b0-4c039da6457d', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('b138c3c4-0896-4c9a-98b0-4c039da6457d', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('ec645ddf-f135-4207-a6ff-332eb798d301', 'Christelle', 'Milla', '15', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('ec645ddf-f135-4207-a6ff-332eb798d301', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('ec645ddf-f135-4207-a6ff-332eb798d301', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('ec645ddf-f135-4207-a6ff-332eb798d301', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('55fe8734-3db1-4ffb-8919-9ff2e5662f8b', 'Raissa', 'Bassogog', '16', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('55fe8734-3db1-4ffb-8919-9ff2e5662f8b', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('55fe8734-3db1-4ffb-8919-9ff2e5662f8b', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('55fe8734-3db1-4ffb-8919-9ff2e5662f8b', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('4d6aee0c-aab8-4b99-832b-ad5ba9670258', 'Mamadou', 'Ngannou', '17', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('4d6aee0c-aab8-4b99-832b-ad5ba9670258', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('4d6aee0c-aab8-4b99-832b-ad5ba9670258', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('4d6aee0c-aab8-4b99-832b-ad5ba9670258', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('a8ad2d40-ce89-4a8d-ae47-266d0ae74053', 'Esther', 'Tchouameni', '18', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('a8ad2d40-ce89-4a8d-ae47-266d0ae74053', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('a8ad2d40-ce89-4a8d-ae47-266d0ae74053', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('a8ad2d40-ce89-4a8d-ae47-266d0ae74053', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('81693198-cffb-4027-aefa-ff26cbd6f9d3', 'Nadine', 'Fotsing', '19', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('81693198-cffb-4027-aefa-ff26cbd6f9d3', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('81693198-cffb-4027-aefa-ff26cbd6f9d3', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('81693198-cffb-4027-aefa-ff26cbd6f9d3', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('59f27ecf-4d97-41ce-b3e1-3d15c02b3221', 'Junior', 'Kamga', '20', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('59f27ecf-4d97-41ce-b3e1-3d15c02b3221', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('59f27ecf-4d97-41ce-b3e1-3d15c02b3221', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('59f27ecf-4d97-41ce-b3e1-3d15c02b3221', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('c1c51778-88bf-4a78-925f-6810b0e8887e', 'Pierre', 'Ekambi', '21', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('c1c51778-88bf-4a78-925f-6810b0e8887e', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('c1c51778-88bf-4a78-925f-6810b0e8887e', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('c1c51778-88bf-4a78-925f-6810b0e8887e', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('326cae20-dae8-419d-90a8-d51c995a26d3', 'Boris', 'Onana', '22', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('326cae20-dae8-419d-90a8-d51c995a26d3', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('326cae20-dae8-419d-90a8-d51c995a26d3', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('326cae20-dae8-419d-90a8-d51c995a26d3', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('d37365a1-9409-4481-aa7c-5e4f9a6b5eee', 'Yvan', 'Kamga', '23', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('d37365a1-9409-4481-aa7c-5e4f9a6b5eee', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('d37365a1-9409-4481-aa7c-5e4f9a6b5eee', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('d37365a1-9409-4481-aa7c-5e4f9a6b5eee', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('9349fb9b-0cd8-486f-b7b7-d88d0c99bdb3', 'Sophie', 'Bassogog', '24', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('9349fb9b-0cd8-486f-b7b7-d88d0c99bdb3', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('9349fb9b-0cd8-486f-b7b7-d88d0c99bdb3', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('9349fb9b-0cd8-486f-b7b7-d88d0c99bdb3', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('a7e877bb-300e-4e15-a5e9-c82ad47a0093', 'Yvan', 'Milla', '25', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('a7e877bb-300e-4e15-a5e9-c82ad47a0093', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('a7e877bb-300e-4e15-a5e9-c82ad47a0093', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('a7e877bb-300e-4e15-a5e9-c82ad47a0093', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('63ec660b-c3b3-4f09-92c7-d0c637ab917f', 'Marie', 'Ekambi', '26', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('63ec660b-c3b3-4f09-92c7-d0c637ab917f', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('63ec660b-c3b3-4f09-92c7-d0c637ab917f', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('63ec660b-c3b3-4f09-92c7-d0c637ab917f', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('19061020-d48c-41b8-b8ad-ed4ab1090b13', 'Kevin', 'Aboubakar', '27', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('19061020-d48c-41b8-b8ad-ed4ab1090b13', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('19061020-d48c-41b8-b8ad-ed4ab1090b13', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('19061020-d48c-41b8-b8ad-ed4ab1090b13', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('83a5bc63-805f-4c4c-9069-79b9c5706c85', 'Yvan', 'Song', '28', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('83a5bc63-805f-4c4c-9069-79b9c5706c85', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('83a5bc63-805f-4c4c-9069-79b9c5706c85', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('83a5bc63-805f-4c4c-9069-79b9c5706c85', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('a97f8fb2-eed6-47c3-aa2c-edcb55e0ad4e', 'Nadine', 'Bassogog', '29', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('a97f8fb2-eed6-47c3-aa2c-edcb55e0ad4e', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('a97f8fb2-eed6-47c3-aa2c-edcb55e0ad4e', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('a97f8fb2-eed6-47c3-aa2c-edcb55e0ad4e', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('72a5a5e7-17ac-4dae-9c4b-84ff6bf2496a', 'Junior', 'Fotsing', '30', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('72a5a5e7-17ac-4dae-9c4b-84ff6bf2496a', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('72a5a5e7-17ac-4dae-9c4b-84ff6bf2496a', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('72a5a5e7-17ac-4dae-9c4b-84ff6bf2496a', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('e40e1075-5965-4fec-b1c3-d91c1b1f64ea', 'Marie', 'Song', '31', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('e40e1075-5965-4fec-b1c3-d91c1b1f64ea', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('e40e1075-5965-4fec-b1c3-d91c1b1f64ea', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('e40e1075-5965-4fec-b1c3-d91c1b1f64ea', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('34697783-a24e-4e3d-b9d2-42d115fdde70', 'Yvan', 'Ekambi', '32', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('34697783-a24e-4e3d-b9d2-42d115fdde70', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('34697783-a24e-4e3d-b9d2-42d115fdde70', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('34697783-a24e-4e3d-b9d2-42d115fdde70', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('6933c0cd-e9d8-4412-b404-d0f42b78bea3', 'Jean', 'Nguema', '33', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('6933c0cd-e9d8-4412-b404-d0f42b78bea3', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('6933c0cd-e9d8-4412-b404-d0f42b78bea3', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('6933c0cd-e9d8-4412-b404-d0f42b78bea3', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('713b8314-f758-4e85-9c87-dbf768895268', 'Raissa', 'Milla', '34', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('713b8314-f758-4e85-9c87-dbf768895268', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('713b8314-f758-4e85-9c87-dbf768895268', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('713b8314-f758-4e85-9c87-dbf768895268', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('d7eb78f2-1466-41f9-8285-fff1c07a50ad', 'Landry', 'Eto''o', '35', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('d7eb78f2-1466-41f9-8285-fff1c07a50ad', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('d7eb78f2-1466-41f9-8285-fff1c07a50ad', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('d7eb78f2-1466-41f9-8285-fff1c07a50ad', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('133292ce-7381-4cda-a68d-fbb9c98d1c31', 'Jean', 'Ekambi', '36', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('133292ce-7381-4cda-a68d-fbb9c98d1c31', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('133292ce-7381-4cda-a68d-fbb9c98d1c31', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('133292ce-7381-4cda-a68d-fbb9c98d1c31', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('774d464e-3a79-4ba2-8807-d5df8d0f03aa', 'Boris', 'Eto''o', '37', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('774d464e-3a79-4ba2-8807-d5df8d0f03aa', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('774d464e-3a79-4ba2-8807-d5df8d0f03aa', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('774d464e-3a79-4ba2-8807-d5df8d0f03aa', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('be32ea19-1d59-458f-ba64-04953f42678c', 'Junior', 'Mbarga', '38', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('be32ea19-1d59-458f-ba64-04953f42678c', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('be32ea19-1d59-458f-ba64-04953f42678c', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('be32ea19-1d59-458f-ba64-04953f42678c', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('0a153d93-3094-4be4-86d3-8a42c67b9d54', 'Mamadou', 'Fotsing', '39', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('0a153d93-3094-4be4-86d3-8a42c67b9d54', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('0a153d93-3094-4be4-86d3-8a42c67b9d54', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('0a153d93-3094-4be4-86d3-8a42c67b9d54', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('488f541d-b7ad-4456-8515-d066de2724de', 'Sandrine', 'Bassogog', '40', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('488f541d-b7ad-4456-8515-d066de2724de', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('488f541d-b7ad-4456-8515-d066de2724de', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('488f541d-b7ad-4456-8515-d066de2724de', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('64e40e41-6405-4740-b4f4-5368cf41f264', 'Junior', 'Onana', '41', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('64e40e41-6405-4740-b4f4-5368cf41f264', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('64e40e41-6405-4740-b4f4-5368cf41f264', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('64e40e41-6405-4740-b4f4-5368cf41f264', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('7bd217c6-9abc-4f84-835d-49395d37e0a7', 'Junior', 'Onana', '42', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('7bd217c6-9abc-4f84-835d-49395d37e0a7', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('7bd217c6-9abc-4f84-835d-49395d37e0a7', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('7bd217c6-9abc-4f84-835d-49395d37e0a7', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('04f6b389-f925-4326-b703-b9eb36096843', 'Yvan', 'Onana', '43', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('04f6b389-f925-4326-b703-b9eb36096843', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('04f6b389-f925-4326-b703-b9eb36096843', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('04f6b389-f925-4326-b703-b9eb36096843', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('dae5ec1e-31f1-4d00-ad56-a008610ab213', 'Esther', 'Song', '44', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('dae5ec1e-31f1-4d00-ad56-a008610ab213', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('dae5ec1e-31f1-4d00-ad56-a008610ab213', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('dae5ec1e-31f1-4d00-ad56-a008610ab213', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('bedb243c-332f-46f1-809a-df66c75f3606', 'Nadine', 'Milla', '45', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('bedb243c-332f-46f1-809a-df66c75f3606', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('bedb243c-332f-46f1-809a-df66c75f3606', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('bedb243c-332f-46f1-809a-df66c75f3606', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('4ed5642f-deed-47a4-873f-6f4b85ad4f12', 'Pierre', 'Eto''o', '46', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('4ed5642f-deed-47a4-873f-6f4b85ad4f12', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('4ed5642f-deed-47a4-873f-6f4b85ad4f12', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('4ed5642f-deed-47a4-873f-6f4b85ad4f12', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('43f04023-095f-4581-8dbe-7308bb9f9359', 'Mamadou', 'Bassogog', '47', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('43f04023-095f-4581-8dbe-7308bb9f9359', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('43f04023-095f-4581-8dbe-7308bb9f9359', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('43f04023-095f-4581-8dbe-7308bb9f9359', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('9a452777-1cd4-4298-a7c5-009bea063327', 'Franck', 'Ekambi', '48', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('9a452777-1cd4-4298-a7c5-009bea063327', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('9a452777-1cd4-4298-a7c5-009bea063327', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('9a452777-1cd4-4298-a7c5-009bea063327', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('1c90ec5c-850a-4cf8-bb64-be82e988732c', 'Yvan', 'Eto''o', '49', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('1c90ec5c-850a-4cf8-bb64-be82e988732c', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('1c90ec5c-850a-4cf8-bb64-be82e988732c', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('1c90ec5c-850a-4cf8-bb64-be82e988732c', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.staff (id, first_name, last_name, biometric_id, job_title, hourly_rate) VALUES ('6b1427ba-ad86-4df3-adc8-d8ad4e5b25db', 'Kevin', 'Song', '50', 'Enseignant', 2500);
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('6b1427ba-ad86-4df3-adc8-d8ad4e5b25db', '2026-02-14 07:45:00', '2026-02-14 16:30:00', '2026-02-14', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('6b1427ba-ad86-4df3-adc8-d8ad4e5b25db', '2026-02-13 07:45:00', '2026-02-13 16:30:00', '2026-02-13', 'PRESENT');
INSERT INTO public.attendance (staff_id, check_in, check_out, date, status) VALUES ('6b1427ba-ad86-4df3-adc8-d8ad4e5b25db', '2026-02-12 07:45:00', '2026-02-12 16:30:00', '2026-02-12', 'PRESENT');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('e3a32a8f-4178-4f29-8512-8fa635f060e7', 'IGR-26-0001', 'Jean', 'Mbarga', '90517b65-e9c3-4767-942d-22b13a1fb6cf', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('e3a32a8f-4178-4f29-8512-8fa635f060e7', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('f702c64d-dc38-4fe8-bdb5-beb85bf684b2', 'IGR-26-0002', 'Christian', 'Mbarga', 'ee1c9055-87ad-4699-a1dd-cb92e11f2bea', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('f702c64d-dc38-4fe8-bdb5-beb85bf684b2', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('1b1514cc-3635-4d96-9651-604fddf018fa', 'IGR-26-0003', 'Esther', 'Ekambi', '2411b310-c13b-4003-91d3-9d6081835f49', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('1b1514cc-3635-4d96-9651-604fddf018fa', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('8889de79-04b9-4421-bd65-1dfb99fae9c2', 'IGR-26-0004', 'Yvan', 'Aboubakar', '286053a4-ff6d-4d65-a480-404ded33529a', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('8889de79-04b9-4421-bd65-1dfb99fae9c2', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('77aa162e-56f3-4e08-802c-595182497b75', 'IGR-26-0005', 'Marie', 'Mbarga', '4a39536f-125a-4951-a384-c8fb8193bccd', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('77aa162e-56f3-4e08-802c-595182497b75', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('bd170948-3a7c-43c1-93f5-c246736fc9a1', 'IGR-26-0006', 'Franck', 'Mbarga', '6f8d8763-ac46-43b9-a815-66dc8528b5da', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('bd170948-3a7c-43c1-93f5-c246736fc9a1', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('ed0c6ead-2ce7-44bc-826e-e90a58c7fbb8', 'IGR-26-0007', 'Vanessa', 'Bassogog', '4999211a-32fa-4cb5-a00f-65449095a735', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('ed0c6ead-2ce7-44bc-826e-e90a58c7fbb8', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('c690d466-fadf-4bd1-9af2-b96e86a27051', 'IGR-26-0008', 'Nadine', 'Onana', 'adc4f9d8-b311-4a20-90c8-361c2b39eb28', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('c690d466-fadf-4bd1-9af2-b96e86a27051', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('b289c8a2-a9b0-4950-903b-7d77fbb540e2', 'IGR-26-0009', 'Pierre', 'Nguema', '46020607-9c2e-412b-a6a4-fdc4aedb38b4', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('b289c8a2-a9b0-4950-903b-7d77fbb540e2', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('59a9dbc4-c9b4-484c-9649-f0b0260c8231', 'IGR-26-0010', 'Landry', 'Ngannou', 'd5ee6ba4-3eef-41a9-ab7e-add4f52d87dd', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('59a9dbc4-c9b4-484c-9649-f0b0260c8231', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('e3950377-13bd-411f-94a6-44c7516263f4', 'IGR-26-0011', 'Pierre', 'Onana', '1f468e82-b8b7-4166-8289-993839c8fb58', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('e3950377-13bd-411f-94a6-44c7516263f4', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('4359a815-a02b-4d2b-bcb3-7e345ea80f5d', 'IGR-26-0012', 'Sandrine', 'Kamga', '76dbbfb6-62fa-4632-ba22-98fdc784f4dc', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('4359a815-a02b-4d2b-bcb3-7e345ea80f5d', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('40eb9299-8396-40b6-a816-618f07db3511', 'IGR-26-0013', 'Kevin', 'Tchouameni', '55a3fa8c-bdde-43fc-b6f1-dfdf3d71b53e', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('40eb9299-8396-40b6-a816-618f07db3511', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('79d68e9c-9d86-49b7-99cf-f1dfb7b22e87', 'IGR-26-0014', 'Christelle', 'Onana', 'dde091e1-dd25-4068-9594-c982536c509f', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('79d68e9c-9d86-49b7-99cf-f1dfb7b22e87', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('5222388a-eb19-4ba3-9f71-f5267c2e9155', 'IGR-26-0015', 'Junior', 'Aboubakar', '1f468e82-b8b7-4166-8289-993839c8fb58', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('5222388a-eb19-4ba3-9f71-f5267c2e9155', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('a874a342-36d9-48fa-8749-59fb87a7650d', 'IGR-26-0016', 'Yvan', 'Onana', 'd934f3af-7005-4440-8fe1-c48418fe6860', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('a874a342-36d9-48fa-8749-59fb87a7650d', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('54345ade-0a02-4ad6-b623-037518a04d8c', 'IGR-26-0017', 'Nadine', 'Tchouameni', '7dd6de0a-7116-4758-974d-99c4b52e7269', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('54345ade-0a02-4ad6-b623-037518a04d8c', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('e01fe9e4-e1d5-4c9b-86d7-c6b2946cd3f7', 'IGR-26-0018', 'Vanessa', 'Tchouameni', 'dde091e1-dd25-4068-9594-c982536c509f', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('e01fe9e4-e1d5-4c9b-86d7-c6b2946cd3f7', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('95a1832b-dfc2-45fc-af0c-416fb47f44c8', 'IGR-26-0019', 'Pierre', 'Onana', 'baf5eab2-daec-4c64-91b6-a53505edddc6', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('95a1832b-dfc2-45fc-af0c-416fb47f44c8', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('b4194d45-3a64-4331-951d-f0e955c2171e', 'IGR-26-0020', 'Jean', 'Matip', '2411b310-c13b-4003-91d3-9d6081835f49', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('b4194d45-3a64-4331-951d-f0e955c2171e', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('a5590f46-aeda-4b17-920a-ad9160666c87', 'IGR-26-0021', 'Kevin', 'Ekambi', 'd934f3af-7005-4440-8fe1-c48418fe6860', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('a5590f46-aeda-4b17-920a-ad9160666c87', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('48061c68-d05d-465a-96ab-fd21b13ae6e6', 'IGR-26-0022', 'Christian', 'Aboubakar', 'd934f3af-7005-4440-8fe1-c48418fe6860', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('48061c68-d05d-465a-96ab-fd21b13ae6e6', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('1492cfd0-8035-438c-882d-0a56c8bf17dd', 'IGR-26-0023', 'Christelle', 'Ekambi', '6c0586f9-9576-49c5-a80a-f516416ed33a', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('1492cfd0-8035-438c-882d-0a56c8bf17dd', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('ecc50deb-14ba-4f0a-a3ec-a50359a36b39', 'IGR-26-0024', 'Esther', 'Eto''o', 'd5ee6ba4-3eef-41a9-ab7e-add4f52d87dd', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('ecc50deb-14ba-4f0a-a3ec-a50359a36b39', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('8dca06e1-7ba3-40b5-ad4d-451b96a84b18', 'IGR-26-0025', 'Raissa', 'Tchouameni', '6c0586f9-9576-49c5-a80a-f516416ed33a', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('8dca06e1-7ba3-40b5-ad4d-451b96a84b18', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('2bde994e-bb90-4b39-b083-ee42793c62ed', 'IGR-26-0026', 'Jean', 'Ngannou', '6c0586f9-9576-49c5-a80a-f516416ed33a', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('2bde994e-bb90-4b39-b083-ee42793c62ed', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('0dda96e5-2158-4c59-b9ec-34e14578de9f', 'IGR-26-0027', 'Jean', 'Nguema', '7dd6de0a-7116-4758-974d-99c4b52e7269', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('0dda96e5-2158-4c59-b9ec-34e14578de9f', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('5f31ba91-db39-4cff-b22a-5ae7c80064a9', 'IGR-26-0028', 'Franck', 'Ngannou', '6dfbfaeb-39de-41a5-99f9-2ae659b136d8', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('5f31ba91-db39-4cff-b22a-5ae7c80064a9', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('096f34f1-7da3-4d26-acb8-08b707cd5879', 'IGR-26-0029', 'Junior', 'Milla', 'ad445210-88c1-4984-8b02-424f232368a2', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('096f34f1-7da3-4d26-acb8-08b707cd5879', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('2d7852bc-2a6b-41e3-964f-465d7d15ba38', 'IGR-26-0030', 'Pierre', 'Tchouameni', 'ad445210-88c1-4984-8b02-424f232368a2', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('2d7852bc-2a6b-41e3-964f-465d7d15ba38', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('13cdeccd-2f68-4c9c-9a2d-a29520e1d099', 'IGR-26-0031', 'Christelle', 'Onana', 'd934f3af-7005-4440-8fe1-c48418fe6860', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('13cdeccd-2f68-4c9c-9a2d-a29520e1d099', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('572ad430-cb32-4c2a-a57e-66cf0a0e63c2', 'IGR-26-0032', 'Esther', 'Onana', 'ee1c9055-87ad-4699-a1dd-cb92e11f2bea', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('572ad430-cb32-4c2a-a57e-66cf0a0e63c2', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('705712d8-d362-4aeb-a292-175cbeddbff8', 'IGR-26-0033', 'Sandrine', 'Ekambi', 'dde091e1-dd25-4068-9594-c982536c509f', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('705712d8-d362-4aeb-a292-175cbeddbff8', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('1ef3167e-8e60-415c-a436-5ccd6aab7800', 'IGR-26-0034', 'Christelle', 'Mbarga', '2411b310-c13b-4003-91d3-9d6081835f49', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('1ef3167e-8e60-415c-a436-5ccd6aab7800', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('0a586d9a-ecae-42dc-a4ca-6f6a746c933a', 'IGR-26-0035', 'Mamadou', 'Kamga', '373f54ce-946e-4f2b-8ce3-0a8371de8843', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('0a586d9a-ecae-42dc-a4ca-6f6a746c933a', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('7f00e5e6-da33-46c0-8af1-7c1c358d8ae3', 'IGR-26-0036', 'Yvan', 'Nguema', 'ad445210-88c1-4984-8b02-424f232368a2', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('7f00e5e6-da33-46c0-8af1-7c1c358d8ae3', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('f18109a4-4499-4316-9aa2-721e5d2d323e', 'IGR-26-0037', 'Kevin', 'Onana', 'ad445210-88c1-4984-8b02-424f232368a2', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('f18109a4-4499-4316-9aa2-721e5d2d323e', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('c08ada8c-d9e1-4286-b1a9-7faaa3eec924', 'IGR-26-0038', 'Vanessa', 'Nguema', 'ad445210-88c1-4984-8b02-424f232368a2', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('c08ada8c-d9e1-4286-b1a9-7faaa3eec924', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('43a867c2-bc5d-4daf-a96d-0810723f046f', 'IGR-26-0039', 'Sophie', 'Onana', 'dde091e1-dd25-4068-9594-c982536c509f', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('43a867c2-bc5d-4daf-a96d-0810723f046f', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('66eb924c-02ad-47a8-bbf2-36adce18e183', 'IGR-26-0040', 'Christian', 'Kamga', 'd5ee6ba4-3eef-41a9-ab7e-add4f52d87dd', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('66eb924c-02ad-47a8-bbf2-36adce18e183', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('288e48c6-4cf1-4996-ab8a-8de37fef1fd5', 'IGR-26-0041', 'Aissatou', 'Onana', 'e365076d-c200-4f66-a775-36bcf2b51c58', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('288e48c6-4cf1-4996-ab8a-8de37fef1fd5', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('58e08e34-6c2c-49ed-813a-11e6a69e2816', 'IGR-26-0042', 'Emmanuel', 'Milla', 'd1c47bdb-16b1-4b1c-884f-69eacfedbcd2', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('58e08e34-6c2c-49ed-813a-11e6a69e2816', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('779676a5-0395-469c-918a-bd87179c4a0f', 'IGR-26-0043', 'Sophie', 'Song', 'd1c47bdb-16b1-4b1c-884f-69eacfedbcd2', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('779676a5-0395-469c-918a-bd87179c4a0f', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('8c2e9c9a-5913-4f1d-a07a-9aed922afdd8', 'IGR-26-0044', 'Marie', 'Nguema', '7d0b2c73-1acc-43ad-bdd4-df8c7a0f03ac', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('8c2e9c9a-5913-4f1d-a07a-9aed922afdd8', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('4a29c0c1-8ae2-4802-8730-33b5283f0b65', 'IGR-26-0045', 'Marie', 'Song', 'dde091e1-dd25-4068-9594-c982536c509f', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('4a29c0c1-8ae2-4802-8730-33b5283f0b65', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('31e2b29e-1530-4c55-97c1-c486b17c673b', 'IGR-26-0046', 'Yvan', 'Song', '1f468e82-b8b7-4166-8289-993839c8fb58', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('31e2b29e-1530-4c55-97c1-c486b17c673b', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('8f6dce47-fd9f-4620-959a-17945372a857', 'IGR-26-0047', 'Boris', 'Ekambi', '7d0b2c73-1acc-43ad-bdd4-df8c7a0f03ac', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('8f6dce47-fd9f-4620-959a-17945372a857', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('157275e7-81bf-495b-bb95-743e75bffec6', 'IGR-26-0048', 'Esther', 'Tchouameni', 'e365076d-c200-4f66-a775-36bcf2b51c58', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('157275e7-81bf-495b-bb95-743e75bffec6', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('730ed7b2-7e9b-4d10-9145-a104a64414d6', 'IGR-26-0049', 'Jean', 'Nguema', 'a4e7268c-0f3c-4883-b42e-3cc31175d8ea', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('730ed7b2-7e9b-4d10-9145-a104a64414d6', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('c13ac1c8-687e-4e63-aa21-04fe8937549d', 'IGR-26-0050', 'Vanessa', 'Matip', '547c9515-b8b5-49bb-9ac8-81c9b487e897', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('c13ac1c8-687e-4e63-aa21-04fe8937549d', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('21465d40-dfa3-429a-871f-0a33b1927378', 'IGR-26-0051', 'Vanessa', 'Tchouameni', 'ee1c9055-87ad-4699-a1dd-cb92e11f2bea', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('21465d40-dfa3-429a-871f-0a33b1927378', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('bb15b788-5e7b-4063-b3bc-c40de33f2ba4', 'IGR-26-0052', 'Christian', 'Bassogog', '6dfbfaeb-39de-41a5-99f9-2ae659b136d8', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('bb15b788-5e7b-4063-b3bc-c40de33f2ba4', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('cf414c59-47e2-4626-8e4c-d39b50ff7da5', 'IGR-26-0053', 'Jean', 'Nguema', '46020607-9c2e-412b-a6a4-fdc4aedb38b4', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('cf414c59-47e2-4626-8e4c-d39b50ff7da5', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('37d2cfc7-3d44-49c6-9373-19acc7434f36', 'IGR-26-0054', 'Pierre', 'Mbarga', 'adc4f9d8-b311-4a20-90c8-361c2b39eb28', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('37d2cfc7-3d44-49c6-9373-19acc7434f36', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('7bfe480f-901f-4d7c-9400-85986c701133', 'IGR-26-0055', 'Boris', 'Tchouameni', 'e365076d-c200-4f66-a775-36bcf2b51c58', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('7bfe480f-901f-4d7c-9400-85986c701133', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('dfbeeda9-c4be-4825-bc51-da4f2b5b6e34', 'IGR-26-0056', 'Sophie', 'Tchouameni', '4999211a-32fa-4cb5-a00f-65449095a735', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('dfbeeda9-c4be-4825-bc51-da4f2b5b6e34', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('f9040d6c-f5fe-4371-891a-aa0398ec9ffe', 'IGR-26-0057', 'Boris', 'Fotsing', '1e354c22-4c74-4815-916b-163738a82607', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('f9040d6c-f5fe-4371-891a-aa0398ec9ffe', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('385e8fd4-e110-4f6a-b4e2-86301a7f2880', 'IGR-26-0058', 'Landry', 'Aboubakar', 'adc4f9d8-b311-4a20-90c8-361c2b39eb28', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('385e8fd4-e110-4f6a-b4e2-86301a7f2880', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('bb83deb9-ba7c-4c92-aad8-c7ee38890f8d', 'IGR-26-0059', 'Jean', 'Mbarga', '6dfbfaeb-39de-41a5-99f9-2ae659b136d8', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('bb83deb9-ba7c-4c92-aad8-c7ee38890f8d', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('4b14123f-2c97-4d6d-9a09-078f9480b878', 'IGR-26-0060', 'Jean', 'Onana', '6c0586f9-9576-49c5-a80a-f516416ed33a', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('4b14123f-2c97-4d6d-9a09-078f9480b878', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('f2550cbc-b610-408c-b873-2545012796ed', 'IGR-26-0061', 'Marie', 'Fotsing', 'd5ee6ba4-3eef-41a9-ab7e-add4f52d87dd', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('f2550cbc-b610-408c-b873-2545012796ed', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('6b0db5c4-88c1-411e-9ac1-8a6af709728f', 'IGR-26-0062', 'Christelle', 'Aboubakar', '76dbbfb6-62fa-4632-ba22-98fdc784f4dc', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('6b0db5c4-88c1-411e-9ac1-8a6af709728f', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('73dba868-0a78-41b9-9372-dbbedcb832e4', 'IGR-26-0063', 'Nadine', 'Ekambi', '55a3fa8c-bdde-43fc-b6f1-dfdf3d71b53e', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('73dba868-0a78-41b9-9372-dbbedcb832e4', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('e54e5df0-6d38-4ea2-9f30-c95cdff9ea3b', 'IGR-26-0064', 'Esther', 'Onana', 'ad445210-88c1-4984-8b02-424f232368a2', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('e54e5df0-6d38-4ea2-9f30-c95cdff9ea3b', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('34060e2e-490a-4032-8afd-9895c3c62133', 'IGR-26-0065', 'Jean', 'Onana', '7d0b2c73-1acc-43ad-bdd4-df8c7a0f03ac', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('34060e2e-490a-4032-8afd-9895c3c62133', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('3f7de1d7-d535-4a9b-bb90-93c80e5f92cc', 'IGR-26-0066', 'Esther', 'Nguema', 'adc4f9d8-b311-4a20-90c8-361c2b39eb28', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('3f7de1d7-d535-4a9b-bb90-93c80e5f92cc', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('8f6d30ea-533c-49d8-8898-6242597eba74', 'IGR-26-0067', 'Boris', 'Milla', '90517b65-e9c3-4767-942d-22b13a1fb6cf', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('8f6d30ea-533c-49d8-8898-6242597eba74', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('eeb79d84-1bea-4344-b63c-6de57ca54825', 'IGR-26-0068', 'Christelle', 'Tchouameni', '547c9515-b8b5-49bb-9ac8-81c9b487e897', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('eeb79d84-1bea-4344-b63c-6de57ca54825', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('66910d65-d0e3-4cc9-8d49-21b5b04bb8a3', 'IGR-26-0069', 'Sophie', 'Song', 'abffd3c7-a697-4d22-849f-d061c860cd89', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('66910d65-d0e3-4cc9-8d49-21b5b04bb8a3', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('0573c632-b7fd-4d2d-99d7-ff88d245b6ac', 'IGR-26-0070', 'Christian', 'Milla', '4a39536f-125a-4951-a384-c8fb8193bccd', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('0573c632-b7fd-4d2d-99d7-ff88d245b6ac', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('a9a55969-5915-42cf-9d57-9de2dd0faf67', 'IGR-26-0071', 'Boris', 'Ngannou', '286053a4-ff6d-4d65-a480-404ded33529a', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('a9a55969-5915-42cf-9d57-9de2dd0faf67', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('6a3ac96b-26c5-4b83-b6e0-6737e00f118b', 'IGR-26-0072', 'Sophie', 'Song', 'abffd3c7-a697-4d22-849f-d061c860cd89', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('6a3ac96b-26c5-4b83-b6e0-6737e00f118b', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('72f7b433-7c78-4ac0-a85c-c846b864f38e', 'IGR-26-0073', 'Vanessa', 'Bassogog', '6dfbfaeb-39de-41a5-99f9-2ae659b136d8', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('72f7b433-7c78-4ac0-a85c-c846b864f38e', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('da82063f-246f-467e-b01d-1b57471a7664', 'IGR-26-0074', 'Pierre', 'Song', 'adc4f9d8-b311-4a20-90c8-361c2b39eb28', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('da82063f-246f-467e-b01d-1b57471a7664', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('be6b6811-4510-44d5-9b13-9a2631530f1d', 'IGR-26-0075', 'Esther', 'Eto''o', 'ee1c9055-87ad-4699-a1dd-cb92e11f2bea', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('be6b6811-4510-44d5-9b13-9a2631530f1d', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('14dac2d3-1316-44f6-8363-8da57c927665', 'IGR-26-0076', 'Raissa', 'Aboubakar', 'd934f3af-7005-4440-8fe1-c48418fe6860', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('14dac2d3-1316-44f6-8363-8da57c927665', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('c21d1e81-0f43-43de-a33d-7794eac7db73', 'IGR-26-0077', 'Yvan', 'Ngannou', '76dbbfb6-62fa-4632-ba22-98fdc784f4dc', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('c21d1e81-0f43-43de-a33d-7794eac7db73', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('5a7df5ea-0049-4bcc-92b8-994f2190531f', 'IGR-26-0078', 'Esther', 'Tchouameni', 'ee1c9055-87ad-4699-a1dd-cb92e11f2bea', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('5a7df5ea-0049-4bcc-92b8-994f2190531f', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('f45a0871-54cd-4d8b-92b0-210815a0aa45', 'IGR-26-0079', 'Emmanuel', 'Song', '2411b310-c13b-4003-91d3-9d6081835f49', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('f45a0871-54cd-4d8b-92b0-210815a0aa45', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('497c32ff-099f-4f55-9d92-57365058e5aa', 'IGR-26-0080', 'Marie', 'Fotsing', '55a3fa8c-bdde-43fc-b6f1-dfdf3d71b53e', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('497c32ff-099f-4f55-9d92-57365058e5aa', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('3abdf05f-9e5d-431e-a64e-ed048ce03bcc', 'IGR-26-0081', 'Marie', 'Matip', '6dfbfaeb-39de-41a5-99f9-2ae659b136d8', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('3abdf05f-9e5d-431e-a64e-ed048ce03bcc', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('9c63e9b4-e35b-4d33-ba9a-3064fa9b772e', 'IGR-26-0082', 'Raissa', 'Song', '1e354c22-4c74-4815-916b-163738a82607', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('9c63e9b4-e35b-4d33-ba9a-3064fa9b772e', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('599f987e-3b3b-4c52-9140-c92a757cea1a', 'IGR-26-0083', 'Esther', 'Song', 'adc4f9d8-b311-4a20-90c8-361c2b39eb28', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('599f987e-3b3b-4c52-9140-c92a757cea1a', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('214ef619-95a8-4cf0-b0ba-7d436c833a36', 'IGR-26-0084', 'Christian', 'Song', '7dd6de0a-7116-4758-974d-99c4b52e7269', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('214ef619-95a8-4cf0-b0ba-7d436c833a36', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('3d8d795f-6e48-491b-9abd-1a24bc043e06', 'IGR-26-0085', 'Kevin', 'Onana', 'd934f3af-7005-4440-8fe1-c48418fe6860', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('3d8d795f-6e48-491b-9abd-1a24bc043e06', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('a42ed07f-c13f-402a-be33-0e2afbe48947', 'IGR-26-0086', 'Nadine', 'Song', '6dfbfaeb-39de-41a5-99f9-2ae659b136d8', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('a42ed07f-c13f-402a-be33-0e2afbe48947', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('de9c4afd-7112-401e-bbca-b8c4c953389b', 'IGR-26-0087', 'Nadine', 'Onana', 'ad445210-88c1-4984-8b02-424f232368a2', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('de9c4afd-7112-401e-bbca-b8c4c953389b', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('ae09a96e-a3d5-47e6-a626-bb6a3a14fba4', 'IGR-26-0088', 'Christelle', 'Aboubakar', 'baf5eab2-daec-4c64-91b6-a53505edddc6', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('ae09a96e-a3d5-47e6-a626-bb6a3a14fba4', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('cdf9272d-31a6-4c96-80dc-f70879afe5e1', 'IGR-26-0089', 'Esther', 'Ngannou', 'd934f3af-7005-4440-8fe1-c48418fe6860', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('cdf9272d-31a6-4c96-80dc-f70879afe5e1', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('6501924b-44bc-465d-a20e-4586b61a70f8', 'IGR-26-0090', 'Sandrine', 'Nguema', 'a4e7268c-0f3c-4883-b42e-3cc31175d8ea', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('6501924b-44bc-465d-a20e-4586b61a70f8', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('30290828-afec-4a25-8315-b9dfb4933138', 'IGR-26-0091', 'Franck', 'Aboubakar', '3eaa62df-e3ad-4759-bd31-cd2f68b258f7', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('30290828-afec-4a25-8315-b9dfb4933138', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('2a5b3c18-7808-47bf-b71d-1ba83bed02c2', 'IGR-26-0092', 'Pierre', 'Eto''o', '2411b310-c13b-4003-91d3-9d6081835f49', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('2a5b3c18-7808-47bf-b71d-1ba83bed02c2', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('edff0d4d-a03f-453b-8d68-e3289167b93b', 'IGR-26-0093', 'Marie', 'Nguema', '373f54ce-946e-4f2b-8ce3-0a8371de8843', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('edff0d4d-a03f-453b-8d68-e3289167b93b', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('d427db84-0dde-4f46-a763-a7b33e4b5321', 'IGR-26-0094', 'Aissatou', 'Song', '7d0b2c73-1acc-43ad-bdd4-df8c7a0f03ac', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('d427db84-0dde-4f46-a763-a7b33e4b5321', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('e65065e7-e580-490a-9a82-44c92fad0d70', 'IGR-26-0095', 'Jean', 'Kamga', '1f468e82-b8b7-4166-8289-993839c8fb58', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('e65065e7-e580-490a-9a82-44c92fad0d70', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('f4b0b428-4b76-4b42-817f-ce27001dd7fa', 'IGR-26-0096', 'Raissa', 'Ngannou', '1f468e82-b8b7-4166-8289-993839c8fb58', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('f4b0b428-4b76-4b42-817f-ce27001dd7fa', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('10cf364d-9c78-4e47-8e89-08e8d9fb83fc', 'IGR-26-0097', 'Sandrine', 'Eto''o', '1e354c22-4c74-4815-916b-163738a82607', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('10cf364d-9c78-4e47-8e89-08e8d9fb83fc', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('a5671ea5-a457-4653-9846-ce52d4b9d413', 'IGR-26-0098', 'Yvan', 'Tchouameni', 'e365076d-c200-4f66-a775-36bcf2b51c58', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('a5671ea5-a457-4653-9846-ce52d4b9d413', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('0c57ff93-a1db-43ba-833c-b3bca2171bb8', 'IGR-26-0099', 'Christelle', 'Mbarga', '46020607-9c2e-412b-a6a4-fdc4aedb38b4', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('0c57ff93-a1db-43ba-833c-b3bca2171bb8', 50000, 'Orange Money');
INSERT INTO public.students (id, matricule, first_name, last_name, class_id, balance) VALUES ('c2622a96-9ae8-4c63-a672-4da8e483bad2', 'IGR-26-0100', 'Vanessa', 'Ngannou', '2411b310-c13b-4003-91d3-9d6081835f49', 150000);
INSERT INTO public.payments (student_id, amount, method) VALUES ('c2622a96-9ae8-4c63-a672-4da8e483bad2', 50000, 'Orange Money');
INSERT INTO public.subjects (id, name, class_id, semester_id, credits_ects) VALUES ('cb35c4b5-2367-4927-b84f-305dfe9badce', 'Algorithmique', '547c9515-b8b5-49bb-9ac8-81c9b487e897', 'f0abd1db-8572-4b17-92b7-1c8c08497a3e', 4);
INSERT INTO public.course_schedule (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room) VALUES ('547c9515-b8b5-49bb-9ac8-81c9b487e897', 'cb35c4b5-2367-4927-b84f-305dfe9badce', '43f04023-095f-4581-8dbe-7308bb9f9359', 1, '08:00', '10:00', 'Salle 101');
INSERT INTO public.evaluations (id, subject_id, name, type, weight_percent) VALUES ('33129787-a3a6-486b-b94a-6f728f549f91', 'Algorithmique', 'Examen Final', 'EXAM', 100);
INSERT INTO public.grades (student_id, evaluation_id, score) VALUES ('e3a32a8f-4178-4f29-8512-8fa635f060e7', '33129787-a3a6-486b-b94a-6f728f549f91', 17);
INSERT INTO public.grades (student_id, evaluation_id, score) VALUES ('f702c64d-dc38-4fe8-bdb5-beb85bf684b2', '33129787-a3a6-486b-b94a-6f728f549f91', 17);
INSERT INTO public.grades (student_id, evaluation_id, score) VALUES ('1b1514cc-3635-4d96-9651-604fddf018fa', '33129787-a3a6-486b-b94a-6f728f549f91', 11);
INSERT INTO public.grades (student_id, evaluation_id, score) VALUES ('8889de79-04b9-4421-bd65-1dfb99fae9c2', '33129787-a3a6-486b-b94a-6f728f549f91', 9);
INSERT INTO public.grades (student_id, evaluation_id, score) VALUES ('77aa162e-56f3-4e08-802c-595182497b75', '33129787-a3a6-486b-b94a-6f728f549f91', 13);
INSERT INTO public.subjects (id, name, class_id, semester_id, credits_ects) VALUES ('8dd19963-ae4c-4993-b0a5-decdf6f5e182', 'Base de Données', '547c9515-b8b5-49bb-9ac8-81c9b487e897', 'f0abd1db-8572-4b17-92b7-1c8c08497a3e', 4);
INSERT INTO public.course_schedule (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room) VALUES ('547c9515-b8b5-49bb-9ac8-81c9b487e897', '8dd19963-ae4c-4993-b0a5-decdf6f5e182', '12bdcd3d-4360-46bf-9b0b-8b11abbc13ab', 1, '08:00', '10:00', 'Salle 101');
INSERT INTO public.evaluations (id, subject_id, name, type, weight_percent) VALUES ('8e6ccfad-8f59-41a8-83a8-2ec94e417763', 'Base de Données', 'Examen Final', 'EXAM', 100);
INSERT INTO public.grades (student_id, evaluation_id, score) VALUES ('e3a32a8f-4178-4f29-8512-8fa635f060e7', '8e6ccfad-8f59-41a8-83a8-2ec94e417763', 16);
INSERT INTO public.grades (student_id, evaluation_id, score) VALUES ('f702c64d-dc38-4fe8-bdb5-beb85bf684b2', '8e6ccfad-8f59-41a8-83a8-2ec94e417763', 12);
INSERT INTO public.grades (student_id, evaluation_id, score) VALUES ('1b1514cc-3635-4d96-9651-604fddf018fa', '8e6ccfad-8f59-41a8-83a8-2ec94e417763', 8);
INSERT INTO public.grades (student_id, evaluation_id, score) VALUES ('8889de79-04b9-4421-bd65-1dfb99fae9c2', '8e6ccfad-8f59-41a8-83a8-2ec94e417763', 17);
INSERT INTO public.grades (student_id, evaluation_id, score) VALUES ('77aa162e-56f3-4e08-802c-595182497b75', '8e6ccfad-8f59-41a8-83a8-2ec94e417763', 12);
INSERT INTO public.subjects (id, name, class_id, semester_id, credits_ects) VALUES ('015e1972-0e9c-4579-9afa-dda7f32bad70', 'Droit', '547c9515-b8b5-49bb-9ac8-81c9b487e897', 'f0abd1db-8572-4b17-92b7-1c8c08497a3e', 4);
INSERT INTO public.course_schedule (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room) VALUES ('547c9515-b8b5-49bb-9ac8-81c9b487e897', '015e1972-0e9c-4579-9afa-dda7f32bad70', '12bdcd3d-4360-46bf-9b0b-8b11abbc13ab', 1, '08:00', '10:00', 'Salle 101');
INSERT INTO public.evaluations (id, subject_id, name, type, weight_percent) VALUES ('6160d260-e0e6-4af2-a0ef-300c26af6939', 'Droit', 'Examen Final', 'EXAM', 100);
INSERT INTO public.grades (student_id, evaluation_id, score) VALUES ('e3a32a8f-4178-4f29-8512-8fa635f060e7', '6160d260-e0e6-4af2-a0ef-300c26af6939', 9);
INSERT INTO public.grades (student_id, evaluation_id, score) VALUES ('f702c64d-dc38-4fe8-bdb5-beb85bf684b2', '6160d260-e0e6-4af2-a0ef-300c26af6939', 14);
INSERT INTO public.grades (student_id, evaluation_id, score) VALUES ('1b1514cc-3635-4d96-9651-604fddf018fa', '6160d260-e0e6-4af2-a0ef-300c26af6939', 9);
INSERT INTO public.grades (student_id, evaluation_id, score) VALUES ('8889de79-04b9-4421-bd65-1dfb99fae9c2', '6160d260-e0e6-4af2-a0ef-300c26af6939', 10);
INSERT INTO public.grades (student_id, evaluation_id, score) VALUES ('77aa162e-56f3-4e08-802c-595182497b75', '6160d260-e0e6-4af2-a0ef-300c26af6939', 13);
INSERT INTO public.subjects (id, name, class_id, semester_id, credits_ects) VALUES ('2abe1282-09b7-48e7-958e-894f6aaea8d7', 'Anglais', '547c9515-b8b5-49bb-9ac8-81c9b487e897', 'f0abd1db-8572-4b17-92b7-1c8c08497a3e', 4);
INSERT INTO public.course_schedule (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room) VALUES ('547c9515-b8b5-49bb-9ac8-81c9b487e897', '2abe1282-09b7-48e7-958e-894f6aaea8d7', '9349fb9b-0cd8-486f-b7b7-d88d0c99bdb3', 1, '08:00', '10:00', 'Salle 101');
INSERT INTO public.evaluations (id, subject_id, name, type, weight_percent) VALUES ('38d9b6a7-aec0-4a6f-bcff-544191e28899', 'Anglais', 'Examen Final', 'EXAM', 100);
INSERT INTO public.grades (student_id, evaluation_id, score) VALUES ('e3a32a8f-4178-4f29-8512-8fa635f060e7', '38d9b6a7-aec0-4a6f-bcff-544191e28899', 18);
INSERT INTO public.grades (student_id, evaluation_id, score) VALUES ('f702c64d-dc38-4fe8-bdb5-beb85bf684b2', '38d9b6a7-aec0-4a6f-bcff-544191e28899', 15);
INSERT INTO public.grades (student_id, evaluation_id, score) VALUES ('1b1514cc-3635-4d96-9651-604fddf018fa', '38d9b6a7-aec0-4a6f-bcff-544191e28899', 8);
INSERT INTO public.grades (student_id, evaluation_id, score) VALUES ('8889de79-04b9-4421-bd65-1dfb99fae9c2', '38d9b6a7-aec0-4a6f-bcff-544191e28899', 15);
INSERT INTO public.grades (student_id, evaluation_id, score) VALUES ('77aa162e-56f3-4e08-802c-595182497b75', '38d9b6a7-aec0-4a6f-bcff-544191e28899', 9);
