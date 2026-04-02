"""
Service d'envoi d'emplois du temps via WhatsApp (WAHA)
Institut Gabriel Rita
"""
import requests
import logging
from typing import List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class WhatsAppService:
    """Service pour l'envoi de messages WhatsApp via WAHA"""
    
    def __init__(self):
        self.base_url = 'http://school-waha:3000'
        self.session_name = 'DEFAULT'
        
    def check_connection(self) -> bool:
        """Vérifie si WAHA est connecté"""
        try:
            response = requests.get(f'{self.base_url}/status')
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Erreur vérification WAHA: {e}")
            return False
    
    def send_message(self, phone: str, message: str) -> dict:
        """Envoie un message texte"""
        try:
            # Ensure phone has country code (e.g. 237 for Cameroon)
            clean_phone = ''.join(filter(str.isdigit, phone))
            if len(clean_phone) == 9:
                clean_phone = f"237{clean_phone}"
            
            payload = {
                'text': message,
                'chatId': f"{clean_phone}@c.us" if not clean_phone.endswith('@c.us') else clean_phone
            }
            
            response = requests.post(
                f'{self.base_url}/api/sendText',
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                logger.info(f"Message envoyé à {clean_phone}")
                return {'success': True, 'messageId': response.json().get('id')}
            else:
                logger.error(f"Échec envoi message: {response.status_code}")
                return {'success': False, 'error': response.text}
                
        except Exception as e:
            logger.error(f"Exception lors de l'envoi: {e}")
            return {'success': False, 'error': str(e)}
    
    def send_document(self, phone: str, document_url: str, caption: str = '') -> dict:
        """Envoie un document (PDF, etc.)"""
        try:
            # Ensure phone has country code
            clean_phone = ''.join(filter(str.isdigit, phone))
            if len(clean_phone) == 9:
                clean_phone = f"237{clean_phone}"
            
            payload = {
                'file': document_url,
                'caption': caption,
                'chatId': f"{clean_phone}@c.us" if not clean_phone.endswith('@c.us') else clean_phone
            }
            
            response = requests.post(
                f'{self.base_url}/api/sendFile',
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                logger.info(f"Document envoyé à {clean_phone}")
                return {'success': True, 'messageId': response.json().get('id')}
            else:
                logger.error(f"Échec envoi document: {response.status_code}")
                return {'success': False, 'error': response.text}
                
        except Exception as e:
            logger.error(f"Exception lors de l'envoi du document: {e}")
            return {'success': False, 'error': str(e)}
    
    def send_contact(self, phone: str, contact_name: str, contact_phone: str) -> dict:
        """Envoie un contact"""
        try:
            payload = {
                'contact': contact_phone,
                'contactName': contact_name,
                'chatId': f"{phone}@c.us"
            }
            
            response = requests.post(
                f'{self.base_url}/api/sendContact',
                json=payload,
                timeout=30
            )
            
            return {'success': response.status_code == 200}
            
        except Exception as e:
            logger.error(f"Exception lors de l'envoi du contact: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_qr(self) -> Optional[str]:
        """Récupère le QR code pour la connexion"""
        try:
            response = requests.get(f'{self.base_url}/qr')
            if response.status_code == 200:
                return response.json().get('qrCode')
        except Exception as e:
            logger.error(f"Erreur récupération QR: {e}")
        return None
    
    def format_schedule_message(self, 
                                teacher_name: str,
                                class_name: str,
                                schedule_data: dict,
                                include_pdf: bool = False) -> str:
        """Formate un message élégant pour l'emploi du temps"""
        
        # En-tête
        message = f"""📚 *EMPLOI DU TEMPS - INSTITUT GABRIEL RITA* 📚

👨‍🏫 *Enseignant:* {teacher_name}
📖 *Classe:* {class_name}
📅 *Période:* {schedule_data.get('period', 'Complète')}

━━━━━━━━━━━━━━━━━━━━━━━

"""
        
        # Corps du message (résumé)
        if 'schedule' in schedule_data:
            days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
            
            for day in days:
                if day in schedule_data['schedule']:
                    slots = schedule_data['schedule'][day]
                    active_slots = [(k, v) for k, v in slots.items() if v is not None]
                    
                    if active_slots:
                        message += f"\n🗓️ *{day.upper()}*\n"
                        for time_slot, info in active_slots:
                            subject = info.get('subject', 'N/A')
                            room = info.get('room', '')
                            message += f"   ⏰ {time_slot}\n"
                            message += f"   📝 {subject}"
                            if room:
                                message += f" (📍 {room})"
                            message += "\n"
                        message += "\n"
        
        # Pied de page
        message += """━━━━━━━━━━━━━━━━━━━━━━━

💡 *Conseils:*
• Arrivez 5 minutes avant le début du cours
• Vérifiez votre salle avant le cours
• Signalez toute absence à l'administration

📞 *Administration:* +237 600 00 00 00
🌐 *Site:* www.institut-gabriel-rita.cm

"""
        
        if include_pdf:
            message += "📎 *Le PDF détaillé est joint à ce message.*\n\n"
        
        message += f"_Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}_"
        
        return message


# Instance globale
whatsapp_service = WhatsAppService()
