from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config.config import config

db = SQLAlchemy()

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Configuration CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)

    @app.errorhandler(Exception)
    def handle_exception(e):
        # Log l'erreur complète
        import traceback
        app.logger.error(f"Unhandled Exception: {str(e)}")
        app.logger.error(traceback.format_exc())
        return {"error": "Internal Server Error", "message": str(e)}, 500

    # Route racine
    @app.route('/')
    def index():
        return """
<!DOCTYPE html>
<html>
<head>
    <title>Service de Rapport Éducatif - Institut Gabriel Rita</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; }
        ul { list-style-type: none; padding: 0; }
        li { margin: 10px 0; padding: 10px; background: #f9f9f9; border-left: 4px solid #007bff; }
        a { text-decoration: none; color: #007bff; font-weight: bold; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Service de Rapport Éducatif - Institut Gabriel Rita</h1>
        <p>Bienvenue dans le service de génération de rapports de l'Institut Gabriel Rita.</p>
        <h2>Routes disponibles :</h2>
        <ul>
            <li><a href="/schedule/&lt;class_name&gt;">/schedule/&lt;class_name&gt;</a> - Emploi du temps d'une classe</li>
            <li><a href="/student/&lt;matricule&gt;">/student/&lt;matricule&gt;</a> - Relevé de compte d'un étudiant</li>
            <li><a href="/global-school">/global-school</a> - Rapport global de l'école</li>
            <li><a href="/late-payments">/late-payments</a> - Paiements en retard</li>
            <li><a href="/moratoriums">/moratoriums</a> - Moratoires</li>
            <li><a href="/payments-by-class/&lt;class_name&gt;">/payments-by-class/&lt;class_name&gt;</a> - Paiements par classe</li>
        </ul>
    </div>
</body>
</html>
        """, 200

    @app.context_processor
    def inject_global_vars():
        import os
        from pathlib import Path
        logo_path = os.path.join(app.root_path, 'static', 'images', 'logo.png')
        if not os.path.exists(logo_path):
            logo_path = os.path.join(app.root_path, 'static', 'img', 'logo.png')
            
        logo_url = None
        if os.path.exists(logo_path):
            # Convert to absolute URI for WeasyPrint
            logo_url = Path(logo_path).as_uri()
            
        return {
            'logo_url': logo_url,
            'current_year': '2025-2026'
        }

    # Enregistrement des Blueprints
    from app.routes.reports import reports_bp
    app.register_blueprint(reports_bp, url_prefix='/api/reports')

    return app

# Exposer une instance Flask par défaut pour Gunicorn "app:app"
app = create_app('default')
