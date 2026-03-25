"""
Routes du service de rapports — Institut Gabriel Rita
Supporte les formats : PDF, DOCX (Word), XLSX (Excel)
"""
from flask import Blueprint, send_file, request, jsonify, Response, send_from_directory, current_app
from app.models.models import (
    Student, Subject, Payment, StudentFee, CourseSchedule, Staff, Class,
    AcademicYear, Specialty, Attendance, Grade, Evaluation
)
from app.services.pdf_service import PDFService
from app.services.docx_service import DocxService
from app.services.excel_service import ExcelService
from datetime import datetime
import io
import requests
import logging
import qrcode
import base64
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(os.path.join(current_app.root_path, 'static'), filename)

# Align with NestJS planning service controller: /schedules
PLANNING_SERVICE_URL = 'http://service-planning:3000/schedules'

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


@reports_bp.route('/invoice/<int:payment_id>', methods=['GET'])
def get_payment_invoice(payment_id):
    logger.info(f"Generating invoice PDF for payment_id: {payment_id}")
    try:
        # Récupération du paiement
        payment = Payment.query.get(payment_id)
        if not payment:
            logger.warning(f"Payment {payment_id} not found")
            return jsonify({'error': 'Payment not found'}), 404
        
        logger.debug(f"Found payment: {payment.reference}")
        
        # Récupération de l'étudiant via le student_fee_id
        student_fee = StudentFee.query.get(payment.student_fee_id)
        if not student_fee:
            logger.warning(f"Student fee {payment.student_fee_id} not found for payment {payment_id}")
            return jsonify({'error': 'Student fee not found'}), 404
        
        student = Student.query.get(student_fee.student_id)
        if not student:
            logger.warning(f"Student {student_fee.student_id} not found for fee {student_fee.id}")
            return jsonify({'error': 'Student not found'}), 404
        
        logger.debug(f"Found student: {student.first_name} {student.last_name}")

        data = {
            'payment': {
                'id': payment.id,
                'reference': payment.reference or payment.receipt_number or f"REC-{payment.id}",
                'amount': float(payment.amount_paid) if payment.amount_paid else 0.0,
                'method': payment.payment_method or 'N/A',
                'paymentDate': payment.payment_date.strftime('%d/%m/%Y %H:%M') if payment.payment_date else 'N/A',
                'amount_total': float(payment.amount_paid) if payment.amount_paid else 0.0,
                'notes': getattr(payment, 'description', '') or ''
            },
            'student': {
                'firstName': student.first_name or '',
                'lastName': student.last_name or '',
                'matricule': student.matricule or '',
                'className': student.class_obj.name if (student.class_obj and student.class_obj.name) else 'N/A'
            },
            'current_date': datetime.now().strftime('%d/%m/%Y %H:%M')
        }

        logger.debug("Rendering PDF...")
        pdf_content = PDFService.generate_pdf('invoice_template.html', data)
        
        if not pdf_content:
            logger.error("PDF generation returned empty content")
            return jsonify({'error': 'Failed to generate PDF content'}), 500

        logger.info("Invoice PDF generated successfully")
        return send_file(
            io.BytesIO(pdf_content),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'recu_{payment.reference or payment.id}.pdf'
        )
    except Exception as e:
        logger.exception(f"Unhandled error generating invoice PDF for payment {payment_id}")
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/invoice-txt/<int:payment_id>', methods=['GET'])
def get_payment_invoice_txt(payment_id):
    try:
        # Récupération du paiement
        payment = Payment.query.get(payment_id)
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        # Récupération de l'étudiant via le student_fee_id
        student_fee = StudentFee.query.get(payment.student_fee_id)
        if not student_fee:
            return jsonify({'error': 'Student fee not found'}), 404
        
        student = Student.query.get(student_fee.student_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        # Récupération de tous les paiements pour calculer le solde
        all_payments = Payment.query.filter_by(student_fee_id=student_fee.id).all()
        total_paid = sum(float(p.amount_paid) for p in all_payments)
        
        balance = float(student_fee.total_due) - total_paid

        # Construction du contenu texte
        text = f"""
INSTITUT GABRIEL RITA
B.P. 7261, DOUALA, CAMEROUN
TEL: (+237) 681 87 39 54

RECU DE PAIEMENT
------------------------------------------------------------

No Recu: {payment.reference or payment.receipt_number}
Date: {payment.payment_date.strftime('%d/%m/%Y %H:%M') if payment.payment_date else 'N/A'}

Eleve: {student.first_name} {student.last_name} ({student.matricule})
Classe: {student.class_obj.name if student.class_obj else 'N/A'}

------------------------------------------------------------
| Description           | Montant                        |
------------------------------------------------------------
| Paiement Scolarité    | {float(payment.amount_paid):>22.2f} |
------------------------------------------------------------

TOTAL PAYE: {float(payment.amount_paid):>28.2f}
RESTE A PAYER: {float(balance):>25.2f}

Mode de paiement: {payment.payment_method}

------------------------------------------------------------
Merci de votre paiement.

Generer le: {datetime.now().strftime('%d/%m/%Y %H:%M')}
"""
        return Response(text, mimetype='text/plain')
    except Exception as e:
        logger.error(f"Error generating invoice TXT: {str(e)}")
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'service': 'report-service', 'timestamp': datetime.now().isoformat()})


@reports_bp.route('/available', methods=['GET'])
def get_available_reports():
    return jsonify([
        {'id': 'schedule-class', 'name': "Emploi du Temps (Classe)", 'description': "EDT d'une classe", 'params': ['class_name'], 'formats': ['pdf', 'docx', 'xlsx'], 'route': '/api/reports/schedule/{class_name}'},
        {'id': 'schedule-teacher', 'name': "Emploi du Temps (Enseignant)", 'description': "EDT d'un enseignant", 'params': ['teacher_name'], 'formats': ['pdf', 'docx', 'xlsx'], 'route': '/api/reports/schedule/teacher/{teacher_name}'},
        {'id': 'schedule-subject', 'name': "Emploi du Temps (Matière)", 'description': "EDT d'une matière", 'params': ['subject_name'], 'formats': ['pdf', 'docx', 'xlsx'], 'route': '/api/reports/schedule/subject/{subject_name}'},
        {'id': 'schedule-synthesis', 'name': "Synthèse des Emplois du Temps", 'description': "EDT Global par Filière", 'params': [], 'formats': ['pdf'], 'route': '/api/reports/schedule/synthesis'},
        {'id': 'student', 'name': "Relevé de Compte Étudiant", 'description': "Historique paiements étudiant", 'params': ['matricule'], 'formats': ['pdf', 'docx', 'xlsx'], 'route': '/api/reports/student/{matricule}'},
        {'id': 'global-school', 'name': "Rapport Global École", 'description': "Vue d'ensemble", 'params': [], 'formats': ['pdf', 'docx', 'xlsx'], 'route': '/api/reports/global-school'},
        {'id': 'late-payments', 'name': "Paiements en Retard", 'description': "Élèves avec retard de paiement", 'params': [], 'formats': ['pdf', 'docx', 'xlsx'], 'route': '/api/reports/late-payments'},
        {'id': 'moratoriums', 'name': "Moratoires", 'description': "Élèves en moratoire", 'params': [], 'formats': ['pdf', 'docx', 'xlsx'], 'route': '/api/reports/moratoriums'},
        {'id': 'payments-by-class', 'name': "Paiements par Classe", 'description': "Synthèse par classe", 'params': ['class_name'], 'formats': ['pdf', 'docx', 'xlsx'], 'route': '/api/reports/payments-by-class/{class_name}'},
        {'id': 'student-card', 'name': "Carte d'Étudiant", 'description': "Génération de la carte d'identité scolaire", 'params': ['matricule'], 'formats': ['pdf'], 'route': '/api/reports/student/card/{matricule}'},
    ])


@reports_bp.route('/student/card/<matricule>', methods=['GET'])
def get_student_card_pdf(matricule):
    try:
        logger.info(f"Generating card for student with matricule: {matricule}")
        student = Student.query.filter_by(matricule=matricule).first()
        if not student:
            logger.warning(f"Student not found with matricule: {matricule}")
            return jsonify({'error': 'Student not found'}), 404
        
        # School configuration
        school_info = {
            'name': 'Institut Gabriel Rita',
            'subtitle': 'Excellence & Innovation',
            'year': '2025-2026',
            'address': 'Yaoundé, Cameroun',
            'phone': '+237 600 000 000'
        }
        
        # Resolve class and specialty
        class_name = student.class_obj.name if student.class_obj else 'N/A'
        specialty_name = student.class_obj.specialty.name if student.class_obj and student.class_obj.specialty else 'N/A'
        
        # Format date
        current_date = datetime.now().strftime('%d/%m/%Y')
        
        # Generate QR Code
        qr = qrcode.QRCode(version=1, box_size=10, border=1)
        qr.add_data(f"STUDENT:{student.matricule}")
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        
        qr_buffer = io.BytesIO()
        qr_img.save(qr_buffer, format='PNG')
        qr_base64 = base64.b64encode(qr_buffer.getvalue()).decode('utf-8')
        qr_url = f"data:image/png;base64,{qr_base64}"
        
        data = {
            'school': school_info,
            'student': {
                'first_name': student.first_name,
                'last_name': student.last_name,
                'matricule': student.matricule,
                'class_name': class_name,
                'specialty_name': specialty_name,
                'photo_url': student.photo_url,
                'phone_number': student.phone,
                'date_of_birth': student.date_of_birth.strftime('%d/%m/%Y') if student.date_of_birth else 'N/A',
                'qr_url': qr_url
            },
            'current_date': current_date
        }

        # Generate the PDF
        pdf_content = PDFService.generate_pdf('student_card.html', data)
        
        # Return as an inline PDF (viewable in browser)
        return send_file(
            io.BytesIO(pdf_content),
            mimetype='application/pdf',
            as_attachment=False,
            download_name=f'carte_etudiant_{matricule}.pdf'
        )
    except Exception as e:
        logger.error(f"Error generating student card for {matricule}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/classes', methods=['GET'])
def get_classes():
    try:
        logger.info("Fetching all classes...")
        classes = Class.query.all()
        logger.info(f"Found {len(classes)} classes")
        return jsonify([{'id': str(c.id), 'name': c.name, 'level': c.level, 'specialty_id': str(c.specialty_id)} for c in classes])
    except Exception as e:
        logger.error(f"Error in get_classes: {str(e)}")
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/teachers', methods=['GET'])
def get_teachers():
    try:
        logger.info("Fetching all teachers...")
        teachers = Staff.query.all()
        logger.info(f"Found {len(teachers)} teachers")
        return jsonify([{'id': str(t.id), 'name': f"{t.first_name} {t.last_name}"} for t in teachers])
    except Exception as e:
        logger.error(f"Error in get_teachers: {str(e)}")
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/subjects', methods=['GET'])
def get_subjects():
    try:
        logger.info("Fetching all subjects...")
        subjects = Subject.query.all()
        logger.info(f"Found {len(subjects)} subjects")
        return jsonify([{'id': str(s.id), 'name': s.name} for s in subjects])
    except Exception as e:
        logger.error(f"Error in get_subjects: {str(e)}")
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/specialties', methods=['GET'])
def get_specialties():
    """
    Retourne la liste des filières (specialties) disponibles pour les rapports de synthèse.
    """
    try:
        logger.info("Fetching all specialties...")
        specialties = Specialty.query.order_by(Specialty.code).all()
        logger.info(f"Found {len(specialties)} specialties")
        return jsonify([
            {'id': str(s.id), 'name': s.name, 'code': s.code}
            for s in specialties
        ])
    except Exception as e:
        logger.error(f"Error in get_specialties: {str(e)}")
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/schedule/<class_ref>', methods=['GET'])
def get_schedule_report(class_ref):
    fmt = _get_format()
    period = request.args.get('period', 'all').lower()
    
    try:
        logger.info(f"Generating schedule report for class {class_ref} in format {fmt}, period {period}")
        
        DAY_SLOTS = [
            ('08:00', '09:50'),
            ('10:05', '12:00'),
            ('13:00', '14:50'),
            ('15:05', '17:00'),
        ]
        EVENING_SLOTS = [
            ('17:30', '19:20'),
            ('19:35', '21:00'),
        ]
        
        if period == 'day':
            OFFICIAL_TIME_SLOTS = DAY_SLOTS
        elif period == 'evening':
            OFFICIAL_TIME_SLOTS = EVENING_SLOTS
        else:
            OFFICIAL_TIME_SLOTS = DAY_SLOTS + EVENING_SLOTS
        
        # Resolve class
        import re
        is_uuid = re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', class_ref.lower())
        
        if is_uuid:
            class_obj = Class.query.get(class_ref)
        else:
            class_obj = Class.query.filter_by(name=class_ref).first()
            
        if not class_obj:
            return jsonify({'error': f'Classe non trouvée: {class_ref}'}), 404

        class_name = class_obj.name
        class_id = str(class_obj.id)
        
        return _process_schedule_request(class_id, class_name, 'class', fmt, OFFICIAL_TIME_SLOTS, period)
    except Exception as e:
        logger.error(f"Error in get_schedule_report: {str(e)}")
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/schedule/teacher/<staff_ref>', methods=['GET'])
def get_teacher_schedule_report(staff_ref):
    fmt = _get_format()
    period = request.args.get('period', 'all').lower()
    
    try:
        logger.info(f"Generating schedule report for teacher {staff_ref} in format {fmt}, period {period}")
        
        DAY_SLOTS = [
            ('08:00', '09:50'),
            ('10:05', '12:00'),
            ('13:00', '14:50'),
            ('15:05', '17:00'),
        ]
        EVENING_SLOTS = [
            ('17:30', '19:20'),
            ('19:35', '21:00'),
        ]
        
        if period == 'day':
            OFFICIAL_TIME_SLOTS = DAY_SLOTS
        elif period == 'evening':
            OFFICIAL_TIME_SLOTS = EVENING_SLOTS
        else:
            OFFICIAL_TIME_SLOTS = DAY_SLOTS + EVENING_SLOTS
        
        # Resolve teacher
        import re
        is_uuid = re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', staff_ref.lower())
        
        if is_uuid:
            teacher = Staff.query.get(staff_ref)
        else:
            teacher = Staff.query.filter(
                (Staff.first_name + " " + Staff.last_name == staff_ref) | 
                (Staff.last_name + " " + Staff.first_name == staff_ref)
            ).first()
        
        if not teacher:
            return jsonify({'error': f'Enseignant non trouvé: {staff_ref}'}), 404
            
        teacher_name = f"{teacher.first_name} {teacher.last_name}"
        teacher_id = str(teacher.id)
        
        return _process_schedule_request(teacher_id, teacher_name, 'staff', fmt, OFFICIAL_TIME_SLOTS, period)
    except Exception as e:
        logger.error(f"Error in get_teacher_schedule_report: {str(e)}")
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/schedule/subject/<subject_ref>', methods=['GET'])
def get_subject_schedule_report(subject_ref):
    fmt = _get_format()
    period = request.args.get('period', 'all').lower()
    
    try:
        logger.info(f"Generating schedule report for subject {subject_ref} in format {fmt}, period {period}")
        
        DAY_SLOTS = [
            ('08:00', '09:50'),
            ('10:05', '12:00'),
            ('13:00', '14:50'),
            ('15:05', '17:00'),
        ]
        EVENING_SLOTS = [
            ('17:30', '19:20'),
            ('19:35', '21:00'),
        ]
        
        if period == 'day':
            OFFICIAL_TIME_SLOTS = DAY_SLOTS
        elif period == 'evening':
            OFFICIAL_TIME_SLOTS = EVENING_SLOTS
        else:
            OFFICIAL_TIME_SLOTS = DAY_SLOTS + EVENING_SLOTS
        
        subject = Subject.query.get(subject_ref) if subject_ref.isdigit() else Subject.query.filter_by(name=subject_ref).first()
        
        if not subject:
            return jsonify({'error': f'Matière non trouvée: {subject_ref}'}), 404
            
        subject_name = subject.name
        subject_id = str(subject.id)
        
        return _process_schedule_request(subject_id, subject_name, 'subject', fmt, OFFICIAL_TIME_SLOTS, period)
    except Exception as e:
        logger.error(f"Error in get_subject_schedule_report: {str(e)}")
        return jsonify({'error': str(e)}), 500


def _process_schedule_request(target_id, target_name, filter_type, fmt, OFFICIAL_TIME_SLOTS, period='all'):
    try:
        # Define base URL for planning service based on filter_type
        if filter_type == 'class':
            url = f'{PLANNING_SERVICE_URL}/class/{target_id}'
        elif filter_type == 'staff':
            url = f'{PLANNING_SERVICE_URL}/staff/{target_id}'
        else:
            # Planning service doesn't have direct /subject filter, fetch all and filter locally
            url = PLANNING_SERVICE_URL
            
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        schedules_raw = response.json()
        
        if filter_type == 'subject':
            schedules_raw = [s for s in schedules_raw if str(s.get('subjectId')) == target_id]

        # Filtrage par période (Jour / Soir)
        if period == 'day':
            schedules_raw = [s for s in schedules_raw if (s.get('startTime') or '') <= '17:00']
        elif period == 'evening':
            schedules_raw = [s for s in schedules_raw if (s.get('startTime') or '') >= '17:30']

        schedules = []
        for s in schedules_raw or []:
            staff_id = s.get('staffId') or s.get('teacherId')
            subj_id = s.get('subjectId')
            cls_id = s.get('classId')
            
            teacher = Staff.query.get(staff_id) if staff_id else None
            subject = Subject.query.get(subj_id) if subj_id else None
            cls = Class.query.get(cls_id) if cls_id else None
            
            schedules.append({
                'className': cls.name if cls else 'N/A',
                'subjectName': subject.name if subject else 'N/A',
                'teacherName': f'{teacher.first_name} {teacher.last_name}' if teacher else 'N/A',
                'dayOfWeek': s.get('dayOfWeek'),
                'startTime': (s.get('startTime') or '')[:5],
                'endTime': (s.get('endTime') or '')[:5],
                'room': s.get('roomName') or s.get('room') or '',
            })

        DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
        schedule_data = {}
        for d in DAYS:
            schedule_data[d] = {}
            for start, end in OFFICIAL_TIME_SLOTS:
                schedule_data[d][f"{start} - {end}"] = None

        for s in schedules:
            try:
                idx = int(s['dayOfWeek']) - 1
            except Exception:
                idx = 0
            day_key = DAYS[idx] if 0 <= idx < len(DAYS) else 'Lundi'
            start = s['startTime'][:5]
            end = s['endTime'][:5]
            time_key = f"{start} - {end}"
            if (start, end) in OFFICIAL_TIME_SLOTS:
                schedule_data[day_key][time_key] = {
                    'subject': s.get('subjectName', 'N/A'),
                    'teacher_name': s.get('teacherName', 'N/A'),
                    'room': s.get('room', ''),
                    'class_name': s.get('className', 'N/A')
                }

        time_slots = [f"{start} - {end}" for start, end in OFFICIAL_TIME_SLOTS]
        
        period_label = " (JOUR)" if period == 'day' else " (SOIR)" if period == 'evening' else ""
        data = {
            'target_name': target_name,
            'filter_type': filter_type,
            'report_title': f"EMPLOI DU TEMPS : {target_name.upper()}",
            'class_name': target_name if filter_type == 'class' else 'N/A',
            'school_year': '2025-2026',
            'current_date': datetime.now().strftime('%d/%m/%Y'),
            'generated_at': datetime.now().strftime('%d/%m/%Y %H:%M'),
            'days': DAYS,
            'time_slots': time_slots,
            'schedule': schedule_data
        }

        filename = f'edt_{filter_type}_{target_name.replace(" ", "_")}'
        if fmt == 'docx':
            return _send_file_response(DocxService.generate_schedule(data), f'{filename}.docx', 'docx')
        elif fmt == 'xlsx':
            return _send_file_response(ExcelService.generate_schedule(data), f'{filename}.xlsx', 'xlsx')
        else:
            return _send_file_response(PDFService.generate_pdf('schedule.html', data, landscape=True), f'{filename}.pdf', 'pdf')
    except Exception as e:
        logger.error(f"Error in _process_schedule_request: {str(e)}")
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/schedule/class/<class_ref>', methods=['GET'])
def get_schedule_report_v2(class_ref):
    return get_schedule_report(class_ref)


@reports_bp.route('/schedule/synthesis', methods=['GET'])
def get_synthesis_schedule_report():
    fmt = _get_format()
    period = request.args.get('period', 'all').lower()
    class_id = request.args.get('class_id')
    staff_id = request.args.get('staff_id')
    # On supporte les IDs de classes séparés par des virgules
    class_ids_param = request.args.get('specialty_ids') or request.args.get('class_ids')
    
    try:
        logger.info(f"Generating synthesis schedule report in format {fmt}, period {period} (class_id={class_id}, class_ids={class_ids_param})")
        
        DAY_SLOTS = [
            ('08:00', '09:50'),
            ('10:05', '12:00'),
            ('13:00', '14:50'),
            ('15:05', '17:00'),
        ]
        EVENING_SLOTS = [
            ('17:30', '19:20'),
            ('19:35', '21:00'),
        ]
        
        if period == 'day':
            OFFICIAL_TIME_SLOTS = DAY_SLOTS
        elif period == 'evening':
            OFFICIAL_TIME_SLOTS = EVENING_SLOTS
        else:
            OFFICIAL_TIME_SLOTS = DAY_SLOTS + EVENING_SLOTS
        
        # 1. Fetch all relevant schedules
        url = PLANNING_SERVICE_URL
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        schedules_raw = response.json()

        # Filtrage par période (Jour / Soir)
        if period == 'day':
            schedules_raw = [s for s in schedules_raw if (s.get('startTime') or '') <= '17:00']
        elif period == 'evening':
            schedules_raw = [s for s in schedules_raw if (s.get('startTime') or '') >= '17:30']

        # 2. Identify target classes
        target_class_ids = set()
        if class_id:
            target_class_ids.add(class_id)
        elif class_ids_param:
            target_class_ids = {x.strip() for x in class_ids_param.split(',') if x.strip()}
        
        # 3. Get class objects for headers
        if target_class_ids:
            classes = Class.query.filter(Class.id.in_(target_class_ids)).all()
        else:
            # If no selection, we could show all active classes in schedules
            active_ids = {str(s.get('classId')) for s in schedules_raw if s.get('classId')}
            classes = Class.query.filter(Class.id.in_(active_ids)).all()
        
        # On trie les classes par nom pour un affichage cohérent
        classes.sort(key=lambda x: x.name)
        
        class_list = [{'id': str(c.id), 'name': c.name} for c in classes]
        class_ids = [c['id'] for c in class_list]

        # 4. Prepare Grid: Days -> TimeSlots -> Classes
        DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
        time_slots = [f"{start} - {end}" for start, end in OFFICIAL_TIME_SLOTS]
        
        grid = {}
        for d in DAYS:
            grid[d] = {}
            for ts in time_slots:
                grid[d][ts] = {}
                for cid in class_ids:
                    grid[d][ts][cid] = None

        # 5. Fill the grid
        for s in schedules_raw or []:
            try:
                cid = str(s.get('classId'))
                if cid not in class_ids: continue
                
                day_idx = int(s.get('dayOfWeek', 1)) - 1
                if not (0 <= day_idx < len(DAYS)): continue
                day_name = DAYS[day_idx]
                
                start = (s.get('startTime') or '')[:5]
                end = (s.get('endTime') or '')[:5]
                ts_key = f"{start} - {end}"
                
                if ts_key in time_slots:
                    subj_id = s.get('subjectId')
                    staff_id = s.get('staffId') or s.get('teacherId')
                    
                    subj = Subject.query.get(subj_id) if subj_id else None
                    teacher = Staff.query.get(staff_id) if staff_id else None
                    
                    grid[day_name][ts_key][cid] = {
                        'subject': subj.name if subj else "N/A",
                        'teacher_name': f"{teacher.first_name} {teacher.last_name}" if teacher else "N/A"
                    }
            except Exception:
                continue

        period_label = " (JOUR)" if period == 'day' else " (SOIR)" if period == 'evening' else ""
        data = {
            'school_name': "INSTITUT GABRIEL RITA",
            'report_title': f"SYNTHÈSE DES EMPLOIS DU TEMPS",
            'school_year': '2025-2026',
            'current_date': datetime.now().strftime('%d/%m/%Y'),
            'generated_at': datetime.now().strftime('%d/%m/%Y %H:%M'),
            'days': DAYS,
            'time_slots': time_slots,
            'classes': class_list,
            'grid': grid
        }

        filename = f'synthese_classes_{datetime.now().strftime("%Y%m%d")}'
        return _send_file_response(PDFService.generate_pdf('synthesis_schedule.html', data, landscape=True), f'{filename}.pdf', 'pdf')

    except Exception as e:
        logger.error(f"Error in get_synthesis_schedule_report: {str(e)}")
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/student/<matricule>', methods=['GET'])
def get_student_report(matricule):
    fmt = _get_format()
    try:
        student = Student.query.filter_by(matricule=matricule).first()
        if not student:
            return jsonify({'error': 'Étudiant non trouvé'}), 404
        
        # Récupération des frais et paiements via StudentFee
        student_fee = StudentFee.query.filter_by(student_id=student.id).first()
        if not student_fee:
            total_due = 0
            payments = []
            balance = 0
        else:
            total_due = float(student_fee.total_due)
            payments = Payment.query.filter_by(student_fee_id=student_fee.id).order_by(Payment.payment_date.desc()).all()
            total_paid = sum(float(p.amount_paid) for p in payments)
            balance = total_due - total_paid

        data = {
            'student': {
                'firstName': student.first_name,
                'lastName': student.last_name,
                'matricule': student.matricule,
                'className': student.class_obj.name if student.class_obj else 'N/A',
                'totalFeesDue': total_due,
                'totalFeesPaid': sum(float(p.amount_paid) for p in payments),
                'balance': balance
            },
            'payments': [
                {
                    'paymentDate': p.payment_date.strftime('%d/%m/%Y %H:%M') if p.payment_date else 'N/A',
                    'reference': p.reference or p.receipt_number,
                    'method': p.payment_method,
                    'amount': float(p.amount_paid)
                } for p in payments
            ],
            'invoices': [], # On pourrait ajouter les détails des frais si nécessaire
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
        logger.error(f"Error in get_student_report: {str(e)}")
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/student-card/<student_ref>', methods=['GET'])
def get_student_card(student_ref):
    """
    Génère la carte scolaire (PDF) d'un élève.
    - student_ref: id numérique ou matricule.
    """
    fmt = _get_format()
    if fmt != 'pdf':
        fmt = 'pdf'

    try:
        # Resolve student
        student = None
        if str(student_ref).isdigit():
            student = Student.query.get(int(student_ref))
        if not student:
            student = Student.query.filter_by(matricule=student_ref).first()

        if not student:
            return jsonify({'error': f'Élève non trouvé: {student_ref}'}), 404

        class_obj = student.class_obj
        specialty = class_obj.specialty if class_obj and hasattr(class_obj, 'specialty') else None
        year = AcademicYear.query.filter_by(is_current=True).first()

        school = {
            'name': "INSTITUT SUPÉRIEUR GABRIEL RITA",
            'subtitle': "Carte d'étudiant",
            'year': year.name if year else '2025-2026',
            'address': "BP : 7261 Douala-Bassa",
            'phone': "Tél : 681 87 39 54 / 693 48 73 95",
        }

        data = {
            'student': {
                'id': student.id,
                'matricule': student.matricule,
                'first_name': student.first_name,
                'last_name': student.last_name,
                'gender': getattr(student, 'gender', None),
                'date_of_birth': getattr(student, 'date_of_birth', None),
                'phone': getattr(student, 'phone', None),
                'parent_phone': getattr(student, 'parent_phone', None),
                'photo_url': getattr(student, 'photo_url', None),
                'class_name': class_obj.name if class_obj else None,
                'specialty_name': specialty.name if specialty else None,
            },
            'school': school,
            'current_date': datetime.now().strftime('%d/%m/%Y'),
        }

        filename = f"carte_scolaire_{student.matricule}"
        return _send_file_response(
            PDFService.generate_pdf('student_card.html', data),
            f'{filename}.pdf',
            'pdf',
        )
    except Exception as e:
        logger.error(f"Error in get_student_card: {str(e)}")
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/global-school', methods=['GET'])
def get_global_school_report():
    fmt = _get_format()
    try:
        students = Student.query.all()
        payments = Payment.query.all()
        
        # Calculer le revenu total à partir de amount_paid
        total_revenue = sum(float(p.amount_paid) for p in payments)
        
        # Calculer les soldes pour chaque étudiant
        student_data = []
        for s in students:
            student_fee = StudentFee.query.filter_by(student_id=s.id).first()
            if student_fee:
                total_due = float(student_fee.total_due)
                total_paid = sum(float(p.amount_paid) for p in Payment.query.filter_by(student_fee_id=student_fee.id).all())
                balance = total_due - total_paid
            else:
                balance = 0
            
            student_data.append({
                'firstName': s.first_name,
                'lastName': s.last_name,
                'matricule': s.matricule,
                'className': s.class_obj.name if s.class_obj else 'N/A',
                'balance': balance,
                'isActive': True # s.is_active n'existe pas dans le modèle ? à vérifier
            })

        data = {
            'school_info': {'name': 'Institut Gabriel Rita', 'year': '2025-2026', 'report_date': datetime.now().strftime('%d/%m/%Y')},
            'statistics': {
                'total_students': len(students),
                'active_students': len(students),
                'total_staff': Staff.query.count(),
                'total_classes': Class.query.count(),
                'total_revenue': total_revenue
            },
            'students': student_data,
        }
        if fmt == 'docx':
            return _send_file_response(DocxService.generate_global_school(data), 'rapport_global_ecole.docx', 'docx')
        elif fmt == 'xlsx':
            return _send_file_response(ExcelService.generate_global_school(data), 'rapport_global_ecole.xlsx', 'xlsx')
        else:
            return _send_file_response(PDFService.generate_pdf('global_school.html', data), 'rapport_global_ecole.pdf', 'pdf')
    except Exception as e:
        logger.error(f"Error in get_global_school_report: {str(e)}")
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/late-payments', methods=['GET'])
def get_late_payments_report():
    fmt = _get_format()
    logger.info(f"Generating late payments report (format: {fmt})")
    try:
        # On cherche tous les frais non soldés
        late_fees = StudentFee.query.filter(StudentFee.is_fully_paid == False).all()
        logger.debug(f"Found {len(late_fees)} late fees")
        
        late_payments_data = []
        for fee in late_fees:
            student = Student.query.get(fee.student_id)
            if not student: 
                logger.warning(f"Student {fee.student_id} not found for fee {fee.id}")
                continue
            
            payments = Payment.query.filter_by(student_fee_id=fee.id).all()
            total_paid = sum(float(p.amount_paid) for p in payments)
            balance = float(fee.total_due) - total_paid
            
            if balance > 0:
                late_payments_data.append({
                    'firstName': student.first_name or '',
                    'lastName': student.last_name or '',
                    'matricule': student.matricule or '',
                    'className': student.class_obj.name if (student.class_obj and student.class_obj.name) else 'N/A',
                    'balance': balance
                })

        data = {
            'school_year': '2025-2026', 
            'current_date': datetime.now().strftime('%d/%m/%Y'),
            'late_payments': late_payments_data,
        }
        
        base_name = 'paiements_en_retard'
        if fmt == 'docx':
            return _send_file_response(DocxService.generate_late_payments(data), f'{base_name}.docx', 'docx')
        elif fmt == 'xlsx':
            return _send_file_response(ExcelService.generate_late_payments(data), f'{base_name}.xlsx', 'xlsx')
        else:
            pdf_content = PDFService.generate_pdf('late_payments.html', data)
            return _send_file_response(pdf_content, f'{base_name}.pdf', 'pdf')
    except Exception as e:
        logger.exception("Error in get_late_payments_report")
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/moratoriums', methods=['GET'])
def get_moratoriums_report():
    fmt = _get_format()
    try:
        students = Student.query.filter(Student.balance < 0).all()
        data = {
            'school_year': '2025-2026', 'current_date': datetime.now().strftime('%d/%m/%Y'),
            'students': [{'firstName': s.first_name, 'lastName': s.last_name, 'matricule': s.matricule,
                          'className': s.class_obj.name if s.class_obj else 'N/A', 'balance': float(s.balance)} for s in students],
        }
        if fmt == 'docx':
            return _send_file_response(DocxService.generate_moratoriums(data), 'rapport_moratoires.docx', 'docx')
        elif fmt == 'xlsx':
            return _send_file_response(ExcelService.generate_moratoriums(data), 'rapport_moratoires.xlsx', 'xlsx')
        else:
            return _send_file_response(PDFService.generate_pdf('moratoriums.html', data), 'rapport_moratoires.pdf', 'pdf')
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/payments-by-class/<class_ref>', methods=['GET'])
def get_payments_by_class_report(class_ref):
    fmt = _get_format()
    try:
        # Resolve class
        if class_ref.isdigit():
            class_obj = Class.query.get(int(class_ref))
        else:
            class_obj = Class.query.filter_by(name=class_ref).first()
            
        if not class_obj:
            return jsonify({'error': f'Classe non trouvée: {class_ref}'}), 404
            
        class_name = class_obj.name
        students = Student.query.filter_by(class_id=class_obj.id).all()
        
        student_list_data = []
        total_invoiced = 0
        total_paid_all = 0
        
        for s in students:
            student_fee = StudentFee.query.filter_by(student_id=s.id).first()
            if student_fee:
                total_due = float(student_fee.total_due)
                payments = Payment.query.filter_by(student_fee_id=student_fee.id).all()
                total_paid = sum(float(p.amount_paid) for p in payments)
                balance = total_due - total_paid
                
                total_invoiced += total_due
                total_paid_all += total_paid
                
                student_list_data.append({
                    'firstName': s.first_name,
                    'lastName': s.last_name,
                    'matricule': s.matricule,
                    'balance': balance,
                    'totalFeesDue': total_due,
                    'totalFeesPaid': total_paid,
                    'payments': [
                        {
                            'paymentDate': p.payment_date.strftime('%d/%m/%Y') if p.payment_date else 'N/A',
                            'reference': p.reference or p.receipt_number,
                            'method': p.payment_method,
                            'amount': float(p.amount_paid)
                        } for p in payments
                    ],
                    'invoices': []
                })
            else:
                student_list_data.append({
                    'firstName': s.first_name,
                    'lastName': s.last_name,
                    'matricule': s.matricule,
                    'balance': 0,
                    'totalFeesDue': 0,
                    'totalFeesPaid': 0,
                    'payments': [],
                    'invoices': []
                })

        data = {
            'class_name': class_name,
            'school_year': '2025-2026',
            'current_date': datetime.now().strftime('%d/%m/%Y'),
            'total_invoiced': total_invoiced,
            'total_paid': total_paid_all,
            'students': student_list_data,
        }
        
        base_name = f'paiements_classe_{class_name}'
        if fmt == 'docx':
            return _send_file_response(DocxService.generate_payments_by_class(data), f'{base_name}.docx', 'docx')
        elif fmt == 'xlsx':
            return _send_file_response(ExcelService.generate_payments_by_class(data), f'{base_name}.xlsx', 'xlsx')
        else:
            return _send_file_response(PDFService.generate_pdf('payment_by_class.html', data), f'{base_name}.pdf', 'pdf')
    except Exception as e:
        logger.error(f"Error in get_payments_by_class_report: {str(e)}")
        return jsonify({'error': str(e)}), 500
