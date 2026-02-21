from flask import render_template, current_app
from weasyprint import HTML, CSS
import os
from io import BytesIO

class PDFService:
    @staticmethod
    def generate_pdf(template_name, data, landscape=False):
        """
        Génère un PDF à partir d'un template HTML et de données.
        """
        # Rendu du HTML avec Jinja2
        html_string = render_template(template_name, **data)
        
        # Configuration CSS de base pour WeasyPrint
        css_path = os.path.join(current_app.root_path, 'static/css/printed.css')
        stylesheets = []
        
        # Charger le CSS s'il existe
        if os.path.exists(css_path):
            stylesheets = [CSS(css_path)]
        else:
            print(f"WARNING: CSS file {css_path} not found")
            # CSS par défaut pour les documents imprimables
            default_css = '''
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                font-size: 12px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            th, td {
                border: 1px solid #000;
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: #f2f2f2;
                font-weight: bold;
            }
            h1, h2, h3 {
                color: #333;
            }
            '''
            stylesheets = [CSS(string=default_css)]
        
        # Génération du PDF
        if landscape:
            # Ajouter un style CSS pour le mode paysage
            css_land = CSS(string='@page { size: A4 landscape; margin: 15mm; }')
            stylesheets.append(css_land)
        
        # Création d'un objet BytesIO pour retourner le PDF
        pdf_buffer = BytesIO()
        html_doc = HTML(string=html_string, base_url=current_app.root_path)
        html_doc.write_pdf(
            target=pdf_buffer,
            stylesheets=stylesheets
        )
        
        # Rembobiner le buffer pour la lecture
        pdf_buffer.seek(0)
        
        return pdf_buffer.getvalue()