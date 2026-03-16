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
    is_active = db.Column('isActive', db.Boolean, default=True)
    
    # Relationships
    # (Removed loose links to models with Integer IDs to avoid errors)


class Role(db.Model):
    __tablename__ = 'roles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True, nullable=False)
    permissions = db.Column(db.JSON)
    description = db.Column(db.Text)
    
    # Relationships
    users = db.relationship('User', backref='role', lazy=True)


class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String, nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'))
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    student = db.relationship('Student', backref='user', uselist=False, lazy=True)
    staff = db.relationship('Staff', backref='user', uselist=False, lazy=True)


class AcademicYear(db.Model):
    __tablename__ = 'academic_years'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    start_date = db.Column('startDate', db.Date)
    end_date = db.Column('endDate', db.Date)
    is_current = db.Column('isCurrent', db.Boolean, default=False)
    
    # Relationships
    classes = db.relationship('Class', backref='academic_year', lazy=True)
    semesters = db.relationship('Semester', backref='academic_year', lazy=True)


class Semester(db.Model):
    __tablename__ = 'semesters'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    
    # Relationships
    subjects = db.relationship('Subject', backref='semester', lazy=True)


class Specialty(db.Model):
    __tablename__ = 'specialties'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    code = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    track_id = db.Column(db.Integer, db.ForeignKey('tracks.id'))


class Track(db.Model):
    __tablename__ = 'tracks'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    code = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    
    # Relationships
    specialties = db.relationship('Specialty', backref='track', lazy=True)


class Class(db.Model):
    __tablename__ = 'classes'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    level = db.Column(db.String)
    specialty_id = db.Column(db.Integer, db.ForeignKey('specialties.id'))
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'))
    campus_id = db.Column(db.Integer) # Loose link, no FK in DB
    tuition_fee = db.Column('tuitionFee', db.Numeric(10, 2), default=0)
    
    # Relationships
    specialty = db.relationship('Specialty', backref='class_list', lazy=True)
    students = db.relationship('Student', backref='class_obj', lazy=True)
    subjects = db.relationship('Subject', backref='class_obj', lazy=True)
    course_schedules = db.relationship('CourseSchedule', backref='class_obj', lazy=True)


class Subject(db.Model):
    __tablename__ = 'subjects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    code = db.Column(db.String, nullable=False)
    credits = db.Column(db.Integer, default=0)
    specialty_id = db.Column(db.Integer, db.ForeignKey('specialties.id'))
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
    teacher_id = db.Column(db.Integer, db.ForeignKey('staff.id'))
    semester_id = db.Column(db.Integer, db.ForeignKey('semesters.id'))
    coefficient = db.Column(db.Integer, default=1)
    credits_ects = db.Column('creditsEcts', db.Integer, default=0)
    color = db.Column(db.String)
    background_color = db.Column('background_color', db.String)
    
    # Relationships
    evaluations = db.relationship('Evaluation', backref='subject', lazy=True)
    course_schedules = db.relationship('CourseSchedule', backref='subject', lazy=True)
    teacher = db.relationship('Staff', backref='subjects', lazy=True)


class Staff(db.Model):
    __tablename__ = 'staff'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    biometric_id = db.Column(db.String, unique=True)
    hourly_rate = db.Column(db.Numeric(10, 2))
    phone_number = db.Column(db.String)
    email = db.Column(db.String)
    
    # Relationships
    attendances = db.relationship('Attendance', backref='staff_member', lazy=True)
    course_schedules = db.relationship('CourseSchedule', backref='teacher', lazy=True)


class Attendance(db.Model):
    __tablename__ = 'attendance_records'
    
    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('staff.id'))
    check_in = db.Column(db.DateTime)
    check_out = db.Column(db.DateTime)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String)


class Student(db.Model):
    __tablename__ = 'students'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    matricule = db.Column(db.String, unique=True, nullable=False)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
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
    medical_visits = db.relationship('MedicalVisit', backref='student', lazy=True)
    housing_allocations = db.relationship('HousingAllocation', backref='student', lazy=True)
    disciplinary_actions = db.relationship('DisciplinaryAction', backref='student', lazy=True)
    internships = db.relationship('Internship', backref='student', lazy=True)
    official_documents = db.relationship('OfficialDocument', backref='student', lazy=True)
    final_projects = db.relationship('FinalProject', backref='student', lazy=True)
    teacher_evaluations = db.relationship('TeacherEvaluation', backref='student', lazy=True)


class Invoice(db.Model):
    __tablename__ = 'finance_student_fees'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    title = db.Column(db.String)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    due_date = db.Column(db.Date)
    status = db.Column(db.String, default='UNPAID')
    
    # Relationships
    payments = db.relationship('Payment', backref='invoice', lazy=True)


class Payment(db.Model):
    __tablename__ = 'finance_payments'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    invoice_id = db.Column(db.Integer, db.ForeignKey('finance_student_fees.id'))
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    method = db.Column(db.String)
    reference = db.Column(db.String)
    payment_date = db.Column(db.DateTime, default=datetime.utcnow)


class CourseSchedule(db.Model):
    __tablename__ = 'course_schedules'
    
    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'))
    teacher_id = db.Column('staff_id', db.Integer, db.ForeignKey('staff.id'))
    day_of_week = db.Column(db.Integer)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    room = db.Column('room_name', db.String)


class Evaluation(db.Model):
    __tablename__ = 'evaluations'
    
    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'))
    name = db.Column(db.String, nullable=False)
    type = db.Column(db.String, nullable=False)
    weight_percent = db.Column(db.Integer, default=100)
    max_score = db.Column(db.Numeric(5, 2), default=20)
    date = db.Column(db.Date)
    
    # Relationships
    grades = db.relationship('Grade', backref='evaluation', lazy=True)


class Grade(db.Model):
    __tablename__ = 'grades'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    evaluation_id = db.Column(db.Integer, db.ForeignKey('evaluations.id'))
    score = db.Column(db.Numeric(5, 2))
    is_absent = db.Column(db.Boolean, default=False)
    comments = db.Column(db.Text)


class MedicalVisit(db.Model):
    __tablename__ = 'medical_visits'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    visit_date = db.Column(db.DateTime)
    diagnosis = db.Column(db.Text)
    treatment = db.Column(db.Text)
    is_confidential = db.Column(db.Boolean, default=True)


class HousingBuilding(db.Model):
    __tablename__ = 'housing_buildings'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    campus_id = db.Column(db.Integer) # Loose link
    
    # Relationships
    rooms = db.relationship('HousingRoom', backref='building', lazy=True)


class HousingRoom(db.Model):
    __tablename__ = 'housing_rooms'
    
    id = db.Column(db.Integer, primary_key=True)
    building_id = db.Column(db.Integer, db.ForeignKey('housing_buildings.id'))
    room_number = db.Column(db.String)
    monthly_rent = db.Column(db.Numeric(10, 2))
    
    # Relationships
    allocations = db.relationship('HousingAllocation', backref='room', lazy=True)


class HousingAllocation(db.Model):
    __tablename__ = 'housing_allocations'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    room_id = db.Column(db.Integer, db.ForeignKey('housing_rooms.id'))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)


class DisciplinaryAction(db.Model):
    __tablename__ = 'disciplinary_actions'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    incident_date = db.Column(db.Date)
    infraction_type = db.Column(db.String)
    sanction = db.Column(db.String)
    status = db.Column(db.String)


class Company(db.Model):
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    industry = db.Column(db.String)
    is_partner = db.Column(db.Boolean, default=False)
    
    # Relationships
    internships = db.relationship('Internship', backref='company', lazy=True)


class Internship(db.Model):
    __tablename__ = 'internships'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    topic = db.Column(db.Text)
    status = db.Column(db.String)


class OfficialDocument(db.Model):
    __tablename__ = 'official_documents'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    type = db.Column(db.String)
    file_path = db.Column(db.Text)
    verification_hash = db.Column(db.String)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)


class FinalProject(db.Model):
    __tablename__ = 'final_projects'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    supervisor_id = db.Column(db.Integer, db.ForeignKey('staff.id'))
    status = db.Column(db.String)


class TeacherEvaluation(db.Model):
    __tablename__ = 'teacher_evaluations'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    staff_id = db.Column(db.Integer, db.ForeignKey('staff.id'))
    rating = db.Column(db.Integer)
    comments = db.Column(db.Text)
