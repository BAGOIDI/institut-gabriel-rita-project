from flask import Blueprint, send_file, request, jsonify
from app.models.models import (
    Student, Subject, Payment, Invoice, CourseSchedule, Staff, Class,
    AcademicYear, Specialty, Attendance, Grade, Evaluation
)
from app.services.pdf_service import PDFService
from datetime import datetime
import io

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/schedule/<class_name>', methods=['GET'])
def get_schedule_pdf(class_name):
    try:
        # Récupération de la classe par nom
        class_obj = Class.query.filter_by(name=class_name).first()
        if not class_obj:
            return jsonify({'error': 'Class not found'}), 404
        
        # Récupération des emplois du temps pour la classe spécifiée
        schedules = CourseSchedule.query.filter_by(class_id=class_obj.id).all()
        
        # Structure de données pour le template
        time_slots = ["08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "14:00 - 15:00", "15:00 - 16:00"]
        
        # Organiser les emplois du temps par jour et heure
        schedule_data = {}
        for schedule in schedules:
            day_key = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][schedule.day_of_week - 1]
            time_key = f"{schedule.start_time.strftime('%H:%M')} - {schedule.end_time.strftime('%H:%M')}"
            
            if day_key not in schedule_data:
                schedule_data[day_key] = {}
            
            # Récupérer le professeur associé
            teacher = Staff.query.get(schedule.teacher_id) if schedule.teacher_id else None
            subject = Subject.query.get(schedule.subject_id) if schedule.subject_id else None
            
            schedule_data[day_key][time_key] = {
                "subject": subject.name if subject else "Non assigné",
                "teacher_name": f"{teacher.first_name} {teacher.last_name}" if teacher else "Non assigné",
                "room": schedule.room,
                "startTime": schedule.start_time.strftime('%H:%M'),
                "endTime": schedule.end_time.strftime('%H:%M')
            }

        data = {
            'class_name': class_name,
            'school_year': '2025-2026',
            'current_date': datetime.now().strftime('%d/%m/%Y'),
            'time_slots': time_slots,
            'schedule': schedule_data
        }

        pdf_content = PDFService.generate_pdf('schedule.html', data, landscape=True)
        
        return send_file(
            io.BytesIO(pdf_content),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'emploi_du_temps_{class_name}.pdf'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/student/<matricule>', methods=['GET'])
def get_student_report(matricule):
    try:
        # Récupération de l'étudiant par matricule
        student = Student.query.filter_by(matricule=matricule).first()
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        # Récupération des paiements de l'étudiant
        payments = Payment.query.filter_by(student_id=student.id).order_by(Payment.payment_date.desc()).all()
        invoices = Invoice.query.filter_by(student_id=student.id).all()
        
        # Calcul des totaux
        total_invoiced = sum(float(invoice.amount) for invoice in invoices)
        total_paid = sum(float(payment.amount) for payment in payments)
        balance = float(student.balance)
        
        data = {
            'student': {
                'firstName': student.first_name,
                'lastName': student.last_name,
                'matricule': student.matricule,
                'class_name': student.student_class.name if student.student_class else 'N/A',
                'totalFeesDue': total_invoiced,
                'totalFeesPaid': total_paid,
                'balance': balance
            },
            'payments': [
                {
                    'paymentDate': payment.payment_date,
                    'reference': payment.reference,
                    'method': payment.method,
                    'amount': float(payment.amount),
                } for payment in payments
            ],
            'invoices': [
                {
                    'title': invoice.title,
                    'amount': float(invoice.amount),
                    'due_date': invoice.due_date,
                    'status': invoice.status
                } for invoice in invoices
            ],
            'current_date': datetime.now().strftime('%d/%m/%Y')
        }
        
        pdf_content = PDFService.generate_pdf('payment_by_student.html', data)
        
        return send_file(
            io.BytesIO(pdf_content),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'releve_compte_{student.first_name}_{student.last_name}.pdf'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/global-school', methods=['GET'])
def get_global_school_report():
    try:
        # Récupération de toutes les données pour le rapport global
        students = Student.query.all()
        staff_members = Staff.query.all()
        schedules = CourseSchedule.query.all()
        payments = Payment.query.all()
        
        # Calculs statistiques
        total_students = len(students)
        active_students = len([s for s in students if s.is_active])
        total_staff = len(staff_members)
        total_classes = len(set([s.class_id for s in students if s.class_id]))
        total_revenue = sum([float(p.amount) for p in payments])
        
        data = {
            'school_info': {
                'name': 'Institut Gabriel Rita',
                'year': '2025-2026',
                'report_date': datetime.now().strftime('%d/%m/%Y')
            },
            'statistics': {
                'total_students': total_students,
                'active_students': active_students,
                'total_staff': total_staff,
                'total_classes': total_classes,
                'total_revenue': total_revenue
            },
            'students': [
                {
                    'firstName': s.first_name,
                    'lastName': s.last_name,
                    'matricule': s.matricule,
                    'className': s.student_class.name if s.student_class else 'N/A',
                    'balance': float(s.balance),
                    'isActive': s.is_active
                } for s in students
            ]
        }
        
        pdf_content = PDFService.generate_pdf('global_school.html', data)
        
        return send_file(
            io.BytesIO(pdf_content),
            mimetype='application/pdf',
            as_attachment=True,
            download_name='rapport_global_ecole.pdf'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/late-payments', methods=['GET'])
def get_late_payments_report():
    try:
        # Récupération des étudiants avec solde impayé
        students = Student.query.all()
        late_payments = []
        
        for student in students:
            if student.balance > 0:
                late_payments.append({
                    'firstName': student.first_name,
                    'lastName': student.last_name,
                    'matricule': student.matricule,
                    'className': student.student_class.name if student.student_class else 'N/A',
                    'balance': float(student.balance)
                })
        
        data = {
            'school_year': '2025-2026',
            'current_date': datetime.now().strftime('%d/%m/%Y'),
            'late_payments': late_payments
        }
        
        pdf_content = PDFService.generate_pdf('late_payments.html', data)
        
        return send_file(
            io.BytesIO(pdf_content),
            mimetype='application/pdf',
            as_attachment=True,
            download_name='paiements_en_retard.pdf'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/moratoriums', methods=['GET'])
def get_moratoriums_report():
    try:
        # Récupération des étudiants avec statut spécial (moratoire)
        # Dans la nouvelle structure, on pourrait filtrer par un champ spécial ou une condition particulière
        # Pour l'instant, nous allons supposer que ce sont les étudiants avec un solde négatif ou un statut particulier
        students_with_moratorium = Student.query.filter(Student.balance < 0).all()
        
        data = {
            'school_year': '2025-2026',
            'current_date': datetime.now().strftime('%d/%m/%Y'),
            'students': [
                {
                    'firstName': s.first_name,
                    'lastName': s.last_name,
                    'matricule': s.matricule,
                    'className': s.student_class.name if s.student_class else 'N/A',
                    'balance': float(s.balance)
                } for s in students_with_moratorium
            ]
        }
        
        pdf_content = PDFService.generate_pdf('moratoriums.html', data)
        
        return send_file(
            io.BytesIO(pdf_content),
            mimetype='application/pdf',
            as_attachment=True,
            download_name='rapport_moratoires.pdf'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/payments-by-class/<class_name>', methods=['GET'])
def get_payments_by_class_report(class_name):
    try:
        # Récupération de la classe par nom
        class_obj = Class.query.filter_by(name=class_name).first()
        if not class_obj:
            return jsonify({'error': 'Class not found'}), 404
        
        # Récupération des étudiants de la classe
        students = Student.query.filter_by(class_id=class_obj.id).all()
        
        # Récupération de tous les paiements pour ces étudiants
        student_ids = [s.id for s in students]
        payments = Payment.query.filter(Payment.student_id.in_(student_ids)).all()
        invoices = Invoice.query.filter(Invoice.student_id.in_(student_ids)).all()
        
        # Calcul des totaux pour la classe
        total_invoiced = sum(float(invoice.amount) for invoice in invoices)
        total_paid = sum(float(payment.amount) for payment in payments)
        
        data = {
            'class_name': class_name,
            'school_year': '2025-2026',
            'current_date': datetime.now().strftime('%d/%m/%Y'),
            'total_invoiced': total_invoiced,
            'total_paid': total_paid,
            'students': [
                {
                    'firstName': s.first_name,
                    'lastName': s.last_name,
                    'matricule': s.matricule,
                    'balance': float(s.balance),
                    'payments': [
                        {
                            'paymentDate': p.payment_date,
                            'reference': p.reference,
                            'method': p.method,
                            'amount': float(p.amount)
                        } for p in payments if str(p.student_id) == str(s.id)
                    ],
                    'invoices': [
                        {
                            'title': invoice.title,
                            'amount': float(invoice.amount),
                            'due_date': invoice.due_date,
                            'status': invoice.status
                        } for invoice in Invoice.query.filter_by(student_id=s.id).all()
                    ]
                } for s in students
            ]
        }
        
        pdf_content = PDFService.generate_pdf('payment_by_class.html', data)
        
        return send_file(
            io.BytesIO(pdf_content),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'paiements_par_classe_{class_name}.pdf'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500