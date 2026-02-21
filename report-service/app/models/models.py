from app import db
from datetime import datetime
import uuid
from sqlalchemy.dialects.postgresql import UUID
from enum import Enum

class UserRoleEnum(Enum):
    admin = 'admin'
    teacher = 'teacher'
    staff = 'staff'

class GenderEnum(Enum):
    M = 'M'
    F = 'F'

class PaymentMethodEnum(Enum):
    CASH = 'CASH'
    MOBILE_MONEY = 'MOBILE_MONEY'
    BANK_TRANSFER = 'BANK_TRANSFER'
    ORANGE_MONEY = 'Orange Money'
    MTN_MOBILE_MONEY = 'MTN Mobile Money'
    CAMOO = 'Camoo'

class StatusEnum(Enum):
    NEW = 'NEW'
    PAID = 'PAID'
    UNPAID = 'UNPAID'
    VALIDATED = 'VALIDATED'
    FAILED = 'FAILED'
    ACTIVE = 'ACTIVE'
    INACTIVE = 'INACTIVE'
    PRESENT = 'PRESENT'
    ABSENT = 'ABSENT'
    LATE = 'LATE'
    CC = 'CC'
    EXAM = 'EXAM'
    RATCH = 'RATCH'
    ADMITTED = 'ADMITTED'
    NOT_ADMITTED = 'NOT_ADMITTED'


class Campus(db.Model):
    __tablename__ = 'campuses'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String, nullable=False)
    city = db.Column(db.String)
    address = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    classes = db.relationship('Class', backref='campus', lazy=True)
    staff = db.relationship('Staff', backref='campus', lazy=True)


class Role(db.Model):
    __tablename__ = 'roles'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String, unique=True, nullable=False)
    permissions = db.Column(db.JSON)
    description = db.Column(db.Text)
    
    # Relationships
    users = db.relationship('User', backref='role', lazy=True)


class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String, nullable=False)
    email = db.Column(db.String, unique=True)
    role_id = db.Column(UUID(as_uuid=True), db.ForeignKey('roles.id'))
    campus_id = db.Column(UUID(as_uuid=True), db.ForeignKey('campuses.id'))
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    student = db.relationship('Student', backref='user', uselist=False, lazy=True)
    audit_logs = db.relationship('AuditLog', backref='user', lazy=True)
    staff = db.relationship('Staff', backref='user', uselist=False, lazy=True)


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    action = db.Column(db.String, nullable=False)
    table_name = db.Column(db.String)
    record_id = db.Column(UUID(as_uuid=True))
    details = db.Column(db.JSON)
    ip_address = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class AcademicYear(db.Model):
    __tablename__ = 'academic_years'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String, nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    is_current = db.Column(db.Boolean, default=False)
    
    # Relationships
    classes = db.relationship('Class', backref='academic_year', lazy=True)
    semesters = db.relationship('Semester', backref='academic_year', lazy=True)


class Semester(db.Model):
    __tablename__ = 'semesters'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String, nullable=False)
    academic_year_id = db.Column(UUID(as_uuid=True), db.ForeignKey('academic_years.id'))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    
    # Relationships
    subjects = db.relationship('Subject', backref='semester', lazy=True)


class Specialty(db.Model):
    __tablename__ = 'specialties'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String, nullable=False)
    domain = db.Column(db.String)
    code = db.Column(db.String)
    
    # Relationships
    classes = db.relationship('Class', backref='specialty', lazy=True)


class Class(db.Model):
    __tablename__ = 'classes'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String, nullable=False)
    specialty_id = db.Column(UUID(as_uuid=True), db.ForeignKey('specialties.id'))
    academic_year_id = db.Column(UUID(as_uuid=True), db.ForeignKey('academic_years.id'))
    campus_id = db.Column(UUID(as_uuid=True), db.ForeignKey('campuses.id'))
    tuition_fee = db.Column(db.Numeric(10, 2), default=0)
    
    # Relationships
    students = db.relationship('Student', backref='class_obj', lazy=True)
    subjects = db.relationship('Subject', backref='class_obj', lazy=True)
    course_schedules = db.relationship('CourseSchedule', backref='class_obj', lazy=True)


class Subject(db.Model):
    __tablename__ = 'subjects'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String, nullable=False)
    code = db.Column(db.String)
    class_id = db.Column(UUID(as_uuid=True), db.ForeignKey('classes.id'))
    semester_id = db.Column(UUID(as_uuid=True), db.ForeignKey('semesters.id'))
    coefficient = db.Column(db.Integer, default=1)
    credits_ects = db.Column(db.Integer, default=0)
    
    # Relationships
    evaluations = db.relationship('Evaluation', backref='subject', lazy=True)
    course_materials = db.relationship('CourseMaterial', backref='subject', lazy=True)
    online_assignments = db.relationship('OnlineAssignment', backref='subject', lazy=True)
    course_schedules = db.relationship('CourseSchedule', backref='subject', lazy=True)


class Prospect(db.Model):
    __tablename__ = 'prospects'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    phone = db.Column(db.String)
    interested_specialty_id = db.Column(UUID(as_uuid=True), db.ForeignKey('specialties.id'))
    status = db.Column(db.String, default='NEW')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    exam_results = db.relationship('ExamResult', backref='prospect', lazy=True)


class EntranceExam(db.Model):
    __tablename__ = 'entrance_exams'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String)
    date = db.Column(db.Date)
    campus_id = db.Column(UUID(as_uuid=True), db.ForeignKey('campuses.id'))
    
    # Relationships
    exam_results = db.relationship('ExamResult', backref='exam', lazy=True)


class ExamResult(db.Model):
    __tablename__ = 'exam_results'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prospect_id = db.Column(UUID(as_uuid=True), db.ForeignKey('prospects.id'))
    exam_id = db.Column(UUID(as_uuid=True), db.ForeignKey('entrance_exams.id'))
    score = db.Column(db.Numeric(5, 2))
    is_admitted = db.Column(db.Boolean, default=False)


class Staff(db.Model):
    __tablename__ = 'staff'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    biometric_id = db.Column(db.String, unique=True)
    job_title = db.Column(db.String)
    hourly_rate = db.Column(db.Numeric(10, 2))
    phone = db.Column(db.String)
    email = db.Column(db.String)
    campus_id = db.Column(UUID(as_uuid=True), db.ForeignKey('campuses.id'))
    
    # Relationships
    attendances = db.relationship('Attendance', backref='staff_member', lazy=True)
    course_sessions = db.relationship('CourseSession', backref='teacher', lazy=True)
    course_schedules = db.relationship('CourseSchedule', backref='teacher', lazy=True)
    evaluations = db.relationship('TeacherEvaluation', backref='evaluator', lazy=True)
    final_projects = db.relationship('FinalProject', backref='supervisor', lazy=True)


class Attendance(db.Model):
    __tablename__ = 'attendance'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    staff_id = db.Column(UUID(as_uuid=True), db.ForeignKey('staff.id'))
    check_in = db.Column(db.DateTime)
    check_out = db.Column(db.DateTime)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String)


class Student(db.Model):
    __tablename__ = 'students'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    matricule = db.Column(db.String, unique=True, nullable=False)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    class_id = db.Column(UUID(as_uuid=True), db.ForeignKey('classes.id'))
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.String(1))
    phone = db.Column(db.String)
    parent_phone = db.Column(db.String)
    balance = db.Column(db.Numeric(10, 2), default=0)
    photo_url = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    invoices = db.relationship('Invoice', backref='student', lazy=True)
    payments = db.relationship('Payment', backref='student', lazy=True)
    grades = db.relationship('Grade', backref='student', lazy=True)
    student_submissions = db.relationship('StudentSubmission', backref='student', lazy=True)
    medical_visits = db.relationship('MedicalVisit', backref='student', lazy=True)
    housing_allocations = db.relationship('HousingAllocation', backref='student', lazy=True)
    disciplinary_actions = db.relationship('DisciplinaryAction', backref='student', lazy=True)
    internships = db.relationship('Internship', backref='student', lazy=True)
    cafeteria_transactions = db.relationship('CafeteriaTransaction', backref='student', lazy=True)
    official_documents = db.relationship('OfficialDocument', backref='student', lazy=True)
    final_projects = db.relationship('FinalProject', backref='student', lazy=True)
    teacher_evaluations = db.relationship('TeacherEvaluation', backref='student', lazy=True)
    transport_subscriptions = db.relationship('TransportSubscription', backref='student', lazy=True)
    book_loans = db.relationship('BookLoan', backref='student', lazy=True)


class Invoice(db.Model):
    __tablename__ = 'invoices'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = db.Column(UUID(as_uuid=True), db.ForeignKey('students.id'))
    title = db.Column(db.String)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    due_date = db.Column(db.Date)
    status = db.Column(db.String, default='UNPAID')
    
    # Relationships
    payments = db.relationship('Payment', backref='invoice', lazy=True)


class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = db.Column(UUID(as_uuid=True), db.ForeignKey('students.id'))
    invoice_id = db.Column(UUID(as_uuid=True), db.ForeignKey('invoices.id'))
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    method = db.Column(db.String)
    reference = db.Column(db.String)
    payment_date = db.Column(db.DateTime, default=datetime.utcnow)


class CourseSchedule(db.Model):
    __tablename__ = 'course_schedule'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id = db.Column(UUID(as_uuid=True), db.ForeignKey('classes.id'))
    subject_id = db.Column(UUID(as_uuid=True), db.ForeignKey('subjects.id'))
    teacher_id = db.Column(UUID(as_uuid=True), db.ForeignKey('staff.id'))
    day_of_week = db.Column(db.Integer)  # CHECK (day_of_week BETWEEN 1 AND 7)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    room = db.Column(db.String)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    course_sessions = db.relationship('CourseSession', backref='schedule', lazy=True)


class CourseSession(db.Model):
    __tablename__ = 'course_sessions'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    schedule_id = db.Column(UUID(as_uuid=True), db.ForeignKey('course_schedule.id'))
    subject_id = db.Column(UUID(as_uuid=True), db.ForeignKey('subjects.id'))
    teacher_id = db.Column(UUID(as_uuid=True), db.ForeignKey('staff.id'))
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time)
    end_time = db.Column(db.Time)
    topic_taught = db.Column(db.Text)
    is_validated = db.Column(db.Boolean, default=False)


class Evaluation(db.Model):
    __tablename__ = 'evaluations'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id = db.Column(UUID(as_uuid=True), db.ForeignKey('subjects.id'))
    name = db.Column(db.String, nullable=False)
    type = db.Column(db.String, nullable=False)  # CC, EXAM, RATCH
    weight_percent = db.Column(db.Integer, default=100)
    max_score = db.Column(db.Numeric(5, 2), default=20)
    date = db.Column(db.Date)
    
    # Relationships
    grades = db.relationship('Grade', backref='evaluation', lazy=True)


class Grade(db.Model):
    __tablename__ = 'grades'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = db.Column(UUID(as_uuid=True), db.ForeignKey('students.id'))
    evaluation_id = db.Column(UUID(as_uuid=True), db.ForeignKey('evaluations.id'))
    score = db.Column(db.Numeric(5, 2))
    is_absent = db.Column(db.Boolean, default=False)
    comments = db.Column(db.Text)


class CourseMaterial(db.Model):
    __tablename__ = 'course_materials'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id = db.Column(UUID(as_uuid=True), db.ForeignKey('subjects.id'))
    title = db.Column(db.String)
    file_url = db.Column(db.Text)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)


class OnlineAssignment(db.Model):
    __tablename__ = 'online_assignments'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id = db.Column(UUID(as_uuid=True), db.ForeignKey('subjects.id'))
    title = db.Column(db.String)
    due_date = db.Column(db.DateTime)
    
    # Relationships
    submissions = db.relationship('StudentSubmission', backref='assignment', lazy=True)


class StudentSubmission(db.Model):
    __tablename__ = 'student_submissions'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id = db.Column(UUID(as_uuid=True), db.ForeignKey('online_assignments.id'))
    student_id = db.Column(UUID(as_uuid=True), db.ForeignKey('students.id'))
    file_url = db.Column(db.Text)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    grade = db.Column(db.Numeric(5, 2))

# Peripherals modules - Transport

class TransportRoute(db.Model):
    __tablename__ = 'transport_routes'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String)
    monthly_fee = db.Column(db.Numeric(10, 2))
    
    # Relationships
    stops = db.relationship('TransportStop', backref='route', lazy=True)
    subscriptions = db.relationship('TransportSubscription', backref='route', lazy=True)


class TransportStop(db.Model):
    __tablename__ = 'transport_stops'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_id = db.Column(UUID(as_uuid=True), db.ForeignKey('transport_routes.id'))
    name = db.Column(db.String)
    pickup_time = db.Column(db.Time)


class TransportSubscription(db.Model):
    __tablename__ = 'transport_subscriptions'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = db.Column(UUID(as_uuid=True), db.ForeignKey('students.id'))
    route_id = db.Column(UUID(as_uuid=True), db.ForeignKey('transport_routes.id'))
    start_date = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True)

# Peripherals modules - Library

class Book(db.Model):
    __tablename__ = 'books'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = db.Column(db.String)
    author = db.Column(db.String)
    isbn = db.Column(db.String)
    total_copies = db.Column(db.Integer)
    
    # Relationships
    loans = db.relationship('BookLoan', backref='book', lazy=True)


class BookLoan(db.Model):
    __tablename__ = 'book_loans'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id = db.Column(UUID(as_uuid=True), db.ForeignKey('books.id'))
    student_id = db.Column(UUID(as_uuid=True), db.ForeignKey('students.id'))
    loan_date = db.Column(db.Date)
    due_date = db.Column(db.Date)
    return_date = db.Column(db.Date)

# Peripherals modules - Health

class MedicalVisit(db.Model):
    __tablename__ = 'medical_visits'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = db.Column(UUID(as_uuid=True), db.ForeignKey('students.id'))
    visit_date = db.Column(db.DateTime)
    diagnosis = db.Column(db.Text)
    treatment = db.Column(db.Text)
    is_confidential = db.Column(db.Boolean, default=True)

# Peripherals modules - Housing

class HousingBuilding(db.Model):
    __tablename__ = 'housing_buildings'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String)
    campus_id = db.Column(UUID(as_uuid=True), db.ForeignKey('campuses.id'))
    
    # Relationships
    rooms = db.relationship('HousingRoom', backref='building', lazy=True)


class HousingRoom(db.Model):
    __tablename__ = 'housing_rooms'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    building_id = db.Column(UUID(as_uuid=True), db.ForeignKey('housing_buildings.id'))
    room_number = db.Column(db.String)
    monthly_rent = db.Column(db.Numeric(10, 2))
    
    # Relationships
    allocations = db.relationship('HousingAllocation', backref='room', lazy=True)


class HousingAllocation(db.Model):
    __tablename__ = 'housing_allocations'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = db.Column(UUID(as_uuid=True), db.ForeignKey('students.id'))
    room_id = db.Column(UUID(as_uuid=True), db.ForeignKey('housing_rooms.id'))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)

# Peripherals modules - Disciplinary

class DisciplinaryAction(db.Model):
    __tablename__ = 'disciplinary_actions'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = db.Column(UUID(as_uuid=True), db.ForeignKey('students.id'))
    incident_date = db.Column(db.Date)
    infraction_type = db.Column(db.String)
    sanction = db.Column(db.String)
    status = db.Column(db.String)

# Peripherals modules - Internship

class Company(db.Model):
    __tablename__ = 'companies'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String)
    industry = db.Column(db.String)
    is_partner = db.Column(db.Boolean, default=False)
    
    # Relationships
    internships = db.relationship('Internship', backref='company', lazy=True)


class Internship(db.Model):
    __tablename__ = 'internships'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = db.Column(UUID(as_uuid=True), db.ForeignKey('students.id'))
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    topic = db.Column(db.Text)
    status = db.Column(db.String)

# Peripherals modules - Cafeteria

class CafeteriaItem(db.Model):
    __tablename__ = 'cafeteria_items'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String)
    price = db.Column(db.Numeric(10, 2))
    
    # Relationships
    transactions = db.relationship('CafeteriaTransaction', backref='item', lazy=True)


class CafeteriaTransaction(db.Model):
    __tablename__ = 'cafeteria_transactions'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = db.Column(UUID(as_uuid=True), db.ForeignKey('students.id'))
    item_id = db.Column(UUID(as_uuid=True), db.ForeignKey('cafeteria_items.id'))
    quantity = db.Column(db.Integer)
    total_amount = db.Column(db.Numeric(10, 2))
    transaction_date = db.Column(db.DateTime, default=datetime.utcnow)

# Peripherals modules - Documents

class OfficialDocument(db.Model):
    __tablename__ = 'official_documents'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = db.Column(UUID(as_uuid=True), db.ForeignKey('students.id'))
    type = db.Column(db.String)
    file_path = db.Column(db.Text)
    verification_hash = db.Column(db.String)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)

# Peripherals modules - Final Projects

class FinalProject(db.Model):
    __tablename__ = 'final_projects'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = db.Column(db.String)
    student_id = db.Column(UUID(as_uuid=True), db.ForeignKey('students.id'))
    supervisor_id = db.Column(UUID(as_uuid=True), db.ForeignKey('staff.id'))
    status = db.Column(db.String)

# Peripherals modules - Teacher Evaluations

class TeacherEvaluation(db.Model):
    __tablename__ = 'teacher_evaluations'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = db.Column(UUID(as_uuid=True), db.ForeignKey('students.id'))
    staff_id = db.Column(UUID(as_uuid=True), db.ForeignKey('staff.id'))
    rating = db.Column(db.Integer)
    comments = db.Column(db.Text)