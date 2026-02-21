from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from config.config import config

db = SQLAlchemy()

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    db.init_app(app)

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
            <li><a href="/api/reports/schedule/&lt;class_name&gt;">/api/reports/schedule/&lt;class_name&gt;</a> - Emploi du temps d'une classe</li>
            <li><a href="/api/reports/student/&lt;matricule&gt;">/api/reports/student/&lt;matricule&gt;</a> - Relevé de compte d'un étudiant</li>
            <li><a href="/api/reports/global-school">/api/reports/global-school</a> - Rapport global de l'école</li>
            <li><a href="/api/reports/late-payments">/api/reports/late-payments</a> - Paiements en retard</li>
            <li><a href="/api/reports/moratoriums">/api/reports/moratoriums</a> - Moratoires</li>
            <li><a href="/api/reports/payments-by-class/&lt;class_name&gt;">/api/reports/payments-by-class/&lt;class_name&gt;</a> - Paiements par classe</li>
        </ul>
    </div>
</body>
</html>
        """, 200

    # Enregistrement des Blueprints
    from app.routes.reports import reports_bp
    app.register_blueprint(reports_bp, url_prefix='/api/reports')

    return app