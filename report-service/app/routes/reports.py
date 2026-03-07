"""
Routes du service de rapports — Institut Gabriel Rita
Supporte les formats : PDF, DOCX (Word), XLSX (Excel)
"""
from flask import Blueprint, send_file, request, jsonify
from app.models.models import (
    Student, Subject, Payment, Invoice, CourseSchedule, Staff, Class,
    AcademicYear, Specialty, Attendance, Grade, Evaluation
)
from app.services.pdf_service import PDFService
from app.services.docx_service import DocxService
from app.services.excel_service import ExcelService
from datetime import datetime
import io
import requests

reports_bp = Blueprint('reports', __name__)

PLANNING_SERVICE_URL = 'http://service-planning:3000/schedule'

MIME_TYPES = {
    'pdf':  'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}


def _send_file_response(content: bytes, filename: str, fmt: str):
    return send_file(
        io.BytesIO(content),
        mimetype=MIME_TYPES.get(fmt, 'application/octet-stream'),
        as_attachment=True,
        download_name=filename,
    )


def _get_format() -> str:
    fmt = request.args.get('format', 'pdf').lower()
    if fmt not in ('pdf', 'docx', 'xlsx'):
        fmt = 'pdf'
    return fmt


@reports_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'service': 'report-service', 'timestamp': datetime.now().isoformat()})


@reports_bp.route('/available', methods=['GET'])
def get_available_reports():
    return jsonify([
        {'id': 'schedule', 'name': "Emploi du Temps", 'description': "EDT d'une classe", 'params': ['class_name'], 'formats': ['pdf', 'docx', 'xlsx'], 'route': '/api/reports/schedule/{class_name}'},
        {'id': 'student', 'name': "Relevé de Compte Étudiant", 'description': "Historique paiements étudiant", 'params': ['matricule'], 'formats': ['pdf', 'docx', 'xlsx'], 'route': '/api/reports/student/{matricule}'},
        {'id': 'global-school', 'name': "Rapport Global École", 'description': "Vue d'ensemble", 'params': [], 'formats': ['pdf', 'docx', 'xlsx'], 'route': '/api/reports/global-school'},
        {'id': 'late-payments', 'name': "Paiements en Retard", 'description': "Élèves avec retard de paiement", 'params': [], 'formats': ['pdf', 'docx', 'xlsx'], 'route': '/api/reports/late-payments'},
        {'id': 'moratoriums', 'name': "Moratoires", 'description': "Élèves en moratoire", 'params': [], 'formats': ['pdf', 'docx', 'xlsx'], 'route': '/api/reports/moratoriums'},
        {'id': 'payments-by-class', 'name': "Paiements par Classe", 'description': "Synthèse par classe", 'params': ['class_name'], 'formats': ['pdf', 'docx', 'xlsx'], 'route': '/api/reports/payments-by-class/{class_name}'},
    ])


@reports_bp.route('/classes', methods=['GET'])
def get_classes():
    try:
        classes = Class.query.all()
        return jsonify([{'id': str(c.id), 'name': c.name} for c in classes])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/schedule/<class_name>', methods=['GET'])
def get_schedule_report(class_name):
    fmt = _get_format()
    try:
        try:
            response = requests.get(f'{PLANNING_SERVICE_URL}/class/{class_name}', timeout=5)
            if response.status_code == 404:
                return jsonify({'error': 'Classe non trouvée'}), 404
            response.raise_for_status()
            schedules = response.json()
        except requests.exceptions.RequestException:
            class_obj = Class.query.filter_by(name=class_name).first()
            if not class_obj:
                schedules = []
            else:
                schedules_db = CourseSchedule.query.filter_by(class_id=class_obj.id).all()
                schedules = []
                for s in schedules_db:
                    teacher = Staff.query.get(s.teacher_id) if s.teacher_id else None
                    subject = Subject.query.get(s.subject_id) if s.subject_id else None
                    schedules.append({
                        'className': class_name,
                        'subjectName': subject.name if subject else 'N/A',
                        'teacherName': f'{teacher.first_name} {teacher.last_name}' if teacher else 'N/A',
                        'dayOfWeek': s.day_of_week,
                        'startTime': s.start_time.strftime('%H:%M'),
                        'endTime': s.end_time.strftime('%H:%M'),
                        'room': s.room or '',
                    })

        DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
        time_slots = ['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
                      '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00']
        schedule_data = {}
        for s in schedules:
            idx = int(s['dayOfWeek']) - 1
            day_key = DAYS[idx] if 0 <= idx < len(DAYS) else 'Lundi'
            time_key = f"{s['startTime']} - {s['endTime']}"
            if day_key not in schedule_data:
                schedule_data[day_key] = {}
            schedule_data[day_key][time_key] = {'subject': s['subjectName'], 'teacher_name': s['teacherName'], 'room': s.get('room', '')}

        data = {'class_name': class_name, 'school_year': '2025-2026', 'current_date': datetime.now().strftime('%d/%m/%Y'), 'time_slots': time_slots, 'schedule': schedule_data}

        if fmt == 'docx':
            return _send_file_response(DocxService.generate_schedule(data), f'emploi_du_temps_{class_name}.docx', 'docx')
        elif fmt == 'xlsx':
            return _send_file_response(ExcelService.generate_schedule(data), f'emploi_du_temps_{class_name}.xlsx', 'xlsx')
        else:
            return _send_file_response(PDFService.generate_pdf('schedule.html', data, landscape=True), f'emploi_du_temps_{class_name}.pdf', 'pdf')
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/student/<matricule>', methods=['GET'])
def get_student_report(matricule):
    fmt = _get_format()
    try:
        student = Student.query.filter_by(matricule=matricule).first()
        if not student:
            return jsonify({'error': 'Étudiant non trouvé'}), 404
        payments = Payment.query.filter_by(student_id=student.id).order_by(Payment.payment_date.desc()).all()
        invoices = Invoice.query.filter_by(student_id=student.id).all()
        data = {
            'student': {'firstName': student.first_name, 'lastName': student.last_name, 'matricule': student.matricule,
                        'class_name': student.student_class.name if student.student_class else 'N/A',
                        'totalFeesDue': sum(float(i.amount) for i in invoices),
                        'totalFeesPaid': sum(float(p.amount) for p in payments),
                        'balance': float(student.balance)},
            'payments': [{'paymentDate': p.payment_date, 'reference': p.reference, 'method': p.method, 'amount': float(p.amount)} for p in payments],
            'invoices': [{'title': i.title, 'amount': float(i.amount), 'due_date': i.due_date, 'status': i.status} for i in invoices],
            'current_date': datetime.now().strftime('%d/%m/%Y'),
        }
        base_name = f'releve_{student.first_name}_{student.last_name}'
        if fmt == 'docx':
            return _send_file_response(DocxService.generate_student_report(data), f'{base_name}.docx', 'docx')
        elif fmt == 'xlsx':
            return _send_file_response(ExcelService.generate_student_report(data), f'{base_name}.xlsx', 'xlsx')
        else:
            return _send_file_response(PDFService.generate_pdf('payment_by_student.html', data), f'{base_name}.pdf', 'pdf')
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/global-school', methods=['GET'])
def get_global_school_report():
    fmt = _get_format()
    try:
        students = Student.query.all()
        payments = Payment.query.all()
        data = {
            'school_info': {'name': 'Institut Gabriel Rita', 'year': '2025-2026', 'report_date': datetime.now().strftime('%d/%m/%Y')},
            'statistics': {'total_students': len(students), 'active_students': len([s for s in students if s.is_active]),
                           'total_staff': Staff.query.count(), 'total_classes': len(set([s.class_id for s in students if s.class_id])),
                           'total_revenue': sum(float(p.amount) for p in payments)},
            'students': [{'firstName': s.first_name, 'lastName': s.last_name, 'matricule': s.matricule,
                          'className': s.student_class.name if s.student_class else 'N/A', 'balance': float(s.balance), 'isActive': s.is_active} for s in students],
        }
        if fmt == 'docx':
            return _send_file_response(DocxService.generate_global_school(data), 'rapport_global_ecole.docx', 'docx')
        elif fmt == 'xlsx':
            return _send_file_response(ExcelService.generate_global_school(data), 'rapport_global_ecole.xlsx', 'xlsx')
        else:
            return _send_file_response(PDFService.generate_pdf('global_school.html', data), 'rapport_global_ecole.pdf', 'pdf')
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/late-payments', methods=['GET'])
def get_late_payments_report():
    fmt = _get_format()
    try:
        students = Student.query.filter(Student.balance > 0).all()
        data = {
            'school_year': '2025-2026', 'current_date': datetime.now().strftime('%d/%m/%Y'),
            'late_payments': [{'firstName': s.first_name, 'lastName': s.last_name, 'matricule': s.matricule,
                               'className': s.student_class.name if s.student_class else 'N/A', 'balance': float(s.balance)} for s in students],
        }
        if fmt == 'docx':
            return _send_file_response(DocxService.generate_late_payments(data), 'paiements_en_retard.docx', 'docx')
        elif fmt == 'xlsx':
            return _send_file_response(ExcelService.generate_late_payments(data), 'paiements_en_retard.xlsx', 'xlsx')
        else:
            return _send_file_response(PDFService.generate_pdf('late_payments.html', data), 'paiements_en_retard.pdf', 'pdf')
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/moratoriums', methods=['GET'])
def get_moratoriums_report():
    fmt = _get_format()
    try:
        students = Student.query.filter(Student.balance < 0).all()
        data = {
            'school_year': '2025-2026', 'current_date': datetime.now().strftime('%d/%m/%Y'),
            'students': [{'firstName': s.first_name, 'lastName': s.last_name, 'matricule': s.matricule,
                          'className': s.student_class.name if s.student_class else 'N/A', 'balance': float(s.balance)} for s in students],
        }
        if fmt == 'docx':
            return _send_file_response(DocxService.generate_moratoriums(data), 'rapport_moratoires.docx', 'docx')
        elif fmt == 'xlsx':
            return _send_file_response(ExcelService.generate_moratoriums(data), 'rapport_moratoires.xlsx', 'xlsx')
        else:
            return _send_file_response(PDFService.generate_pdf('moratoriums.html', data), 'rapport_moratoires.pdf', 'pdf')
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/payments-by-class/<class_name>', methods=['GET'])
def get_payments_by_class_report(class_name):
    fmt = _get_format()
    try:
        class_obj = Class.query.filter_by(name=class_name).first()
        if not class_obj:
            return jsonify({'error': 'Classe non trouvée'}), 404
        students = Student.query.filter_by(class_id=class_obj.id).all()
        student_ids = [s.id for s in students]
        payments = Payment.query.filter(Payment.student_id.in_(student_ids)).all()
        invoices = Invoice.query.filter(Invoice.student_id.in_(student_ids)).all()
        data = {
            'class_name': class_name, 'school_year': '2025-2026', 'current_date': datetime.now().strftime('%d/%m/%Y'),
            'total_invoiced': sum(float(i.amount) for i in invoices),
            'total_paid': sum(float(p.amount) for p in payments),
            'students': [
                {'firstName': s.first_name, 'lastName': s.last_name, 'matricule': s.matricule, 'balance': float(s.balance),
                 'payments': [{'paymentDate': p.payment_date, 'reference': p.reference, 'method': p.method, 'amount': float(p.amount)} for p in payments if str(p.student_id) == str(s.id)],
                 'invoices': [{'title': i.title, 'amount': float(i.amount), 'due_date': i.due_date, 'status': i.status} for i in Invoice.query.filter_by(student_id=s.id).all()]}
                for s in students
            ],
        }
        base_name = f'paiements_classe_{class_name}'
        if fmt == 'docx':
            return _send_file_response(DocxService.generate_payments_by_class(data), f'{base_name}.docx', 'docx')
        elif fmt == 'xlsx':
            return _send_file_response(ExcelService.generate_payments_by_class(data), f'{base_name}.xlsx', 'xlsx')
        else:
            return _send_file_response(PDFService.generate_pdf('payment_by_class.html', data), f'{base_name}.pdf', 'pdf')
    except Exception as e:
        return jsonify({'error': str(e)}), 500
