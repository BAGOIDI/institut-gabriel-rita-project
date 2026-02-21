import unittest
from datetime import datetime, date
from decimal import Decimal
from app.models.models import (
    db, app, Campus, Role, User, AuditLog, AcademicYear, 
    Semester, Specialty, Class, Subject, Prospect, EntranceExam, 
    ExamResult, Staff, Attendance, Student, Invoice, Payment, 
    CourseSchedule, CourseSession, Evaluation, Grade
)

class TestModels(unittest.TestCase):
    """Tests unitaires pour les modèles de l'application"""

    @classmethod
    def setUpClass(cls):
        """Configuration initiale pour les tests"""
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['WTF_CSRF_ENABLED'] = False
        
        cls.app_context = app.app_context()
        cls.app_context.push()
        
        db.create_all()

    @classmethod
    def tearDownClass(cls):
        """Nettoyage après les tests"""
        db.session.remove()
        db.drop_all()
        cls.app_context.pop()

    def setUp(self):
        """Configuration avant chaque test"""
        db.session.rollback()
        # Nettoyer les données de test
        for table in reversed(db.metadata.sorted_tables):
            db.engine.execute(table.delete())

    def test_create_campus(self):
        """Test de création d'un campus"""
        campus = Campus(
            name='Campus Test',
            city='Ville Test',
            address='Adresse Test'
        )
        db.session.add(campus)
        db.session.commit()
        
        self.assertIsNotNone(campus.id)
        self.assertEqual(campus.name, 'Campus Test')
        self.assertEqual(campus.city, 'Ville Test')
        self.assertTrue(campus.is_active)

    def test_create_role(self):
        """Test de création d'un rôle"""
        role = Role(
            name='Administrateur',
            description='Rôle administrateur'
        )
        db.session.add(role)
        db.session.commit()
        
        self.assertIsNotNone(role.id)
        self.assertEqual(role.name, 'Administrateur')
        self.assertEqual(role.description, 'Rôle administrateur')

    def test_create_academic_year(self):
        """Test de création d'une année académique"""
        academic_year = AcademicYear(
            name='2026-2027',
            start_date=date(2026, 9, 1),
            end_date=date(2027, 6, 30),
            is_current=True
        )
        db.session.add(academic_year)
        db.session.commit()
        
        self.assertIsNotNone(academic_year.id)
        self.assertEqual(academic_year.name, '2026-2027')
        self.assertEqual(academic_year.start_date, date(2026, 9, 1))
        self.assertTrue(academic_year.is_current)

    def test_create_student(self):
        """Test de création d'un étudiant"""
        # Créer les objets requis
        campus = Campus(name='Campus Test', city='Ville Test')
        db.session.add(campus)
        
        role = Role(name='Etudiant', description='Rôle étudiant')
        db.session.add(role)
        
        academic_year = AcademicYear(
            name='2026-2027',
            start_date=date(2026, 9, 1),
            end_date=date(2027, 6, 30)
        )
        db.session.add(academic_year)
        
        specialty = Specialty(name='Génie Logiciel', domain='Informatique')
        db.session.add(specialty)
        
        class_obj = Class(
            name='BTS 1 - GL',
            specialty_id=specialty.id,
            academic_year_id=academic_year.id,
            campus_id=campus.id
        )
        db.session.add(class_obj)
        
        db.session.commit()
        
        # Créer l'étudiant
        student = Student(
            matricule='IGR-26-0001',
            first_name='Jean',
            last_name='Dupont',
            class_id=class_obj.id,
            date_of_birth=date(2000, 1, 1),
            gender='M',
            balance=Decimal('150000.00')
        )
        db.session.add(student)
        db.session.commit()
        
        self.assertIsNotNone(student.id)
        self.assertEqual(student.matricule, 'IGR-26-0001')
        self.assertEqual(student.first_name, 'Jean')
        self.assertEqual(student.last_name, 'Dupont')
        self.assertEqual(student.balance, Decimal('150000.00'))

    def test_create_invoice(self):
        """Test de création d'une facture"""
        # Créer les objets requis
        campus = Campus(name='Campus Test', city='Ville Test')
        db.session.add(campus)
        
        role = Role(name='Etudiant', description='Rôle étudiant')
        db.session.add(role)
        
        academic_year = AcademicYear(
            name='2026-2027',
            start_date=date(2026, 9, 1),
            end_date=date(2027, 6, 30)
        )
        db.session.add(academic_year)
        
        specialty = Specialty(name='Génie Logiciel', domain='Informatique')
        db.session.add(specialty)
        
        class_obj = Class(
            name='BTS 1 - GL',
            specialty_id=specialty.id,
            academic_year_id=academic_year.id,
            campus_id=campus.id
        )
        db.session.add(class_obj)
        
        student = Student(
            matricule='IGR-26-0001',
            first_name='Jean',
            last_name='Dupont',
            class_id=class_obj.id,
            date_of_birth=date(2000, 1, 1),
            gender='M',
            balance=Decimal('150000.00')
        )
        db.session.add(student)
        
        db.session.commit()
        
        # Créer la facture
        invoice = Invoice(
            student_id=student.id,
            title='Frais de scolarité',
            amount=Decimal('350000.00'),
            due_date=date(2026, 10, 15),
            status='UNPAID'
        )
        db.session.add(invoice)
        db.session.commit()
        
        self.assertIsNotNone(invoice.id)
        self.assertEqual(invoice.title, 'Frais de scolarité')
        self.assertEqual(invoice.amount, Decimal('350000.00'))
        self.assertEqual(invoice.status, 'UNPAID')

    def test_create_payment(self):
        """Test de création d'un paiement"""
        # Créer les objets requis
        campus = Campus(name='Campus Test', city='Ville Test')
        db.session.add(campus)
        
        academic_year = AcademicYear(
            name='2026-2027',
            start_date=date(2026, 9, 1),
            end_date=date(2027, 6, 30)
        )
        db.session.add(academic_year)
        
        specialty = Specialty(name='Génie Logiciel', domain='Informatique')
        db.session.add(specialty)
        
        class_obj = Class(
            name='BTS 1 - GL',
            specialty_id=specialty.id,
            academic_year_id=academic_year.id,
            campus_id=campus.id
        )
        db.session.add(class_obj)
        
        student = Student(
            matricule='IGR-26-0001',
            first_name='Jean',
            last_name='Dupont',
            class_id=class_obj.id,
            date_of_birth=date(2000, 1, 1),
            gender='M',
            balance=Decimal('150000.00')
        )
        db.session.add(student)
        
        invoice = Invoice(
            student_id=student.id,
            title='Frais de scolarité',
            amount=Decimal('350000.00'),
            due_date=date(2026, 10, 15),
            status='UNPAID'
        )
        db.session.add(invoice)
        
        db.session.commit()
        
        # Créer le paiement
        payment = Payment(
            student_id=student.id,
            invoice_id=invoice.id,
            amount=Decimal('50000.00'),
            method='Orange Money',
            reference='OM123456789'
        )
        db.session.add(payment)
        db.session.commit()
        
        self.assertIsNotNone(payment.id)
        self.assertEqual(payment.amount, Decimal('50000.00'))
        self.assertEqual(payment.method, 'Orange Money')
        self.assertEqual(payment.reference, 'OM123456789')

    def test_create_course_schedule(self):
        """Test de création d'un emploi du temps de cours"""
        # Créer les objets requis
        campus = Campus(name='Campus Test', city='Ville Test')
        db.session.add(campus)
        
        academic_year = AcademicYear(
            name='2026-2027',
            start_date=date(2026, 9, 1),
            end_date=date(2027, 6, 30)
        )
        db.session.add(academic_year)
        
        specialty = Specialty(name='Génie Logiciel', domain='Informatique')
        db.session.add(specialty)
        
        class_obj = Class(
            name='BTS 1 - GL',
            specialty_id=specialty.id,
            academic_year_id=academic_year.id,
            campus_id=campus.id
        )
        db.session.add(class_obj)
        
        subject = Subject(
            name='Algorithmique',
            class_id=class_obj.id,
            coefficient=4,
            credits_ects=4
        )
        db.session.add(subject)
        
        staff = Staff(
            first_name='Prof',
            last_name='Test',
            biometric_id='12345',
            job_title='Enseignant'
        )
        db.session.add(staff)
        
        db.session.commit()
        
        # Créer l'emploi du temps
        schedule = CourseSchedule(
            class_id=class_obj.id,
            subject_id=subject.id,
            teacher_id=staff.id,
            day_of_week=1,  # Lundi
            start_time=datetime.strptime('08:00', '%H:%M').time(),
            end_time=datetime.strptime('10:00', '%H:%M').time(),
            room='Salle A1'
        )
        db.session.add(schedule)
        db.session.commit()
        
        self.assertIsNotNone(schedule.id)
        self.assertEqual(schedule.day_of_week, 1)
        self.assertEqual(schedule.room, 'Salle A1')


if __name__ == '__main__':
    unittest.main()