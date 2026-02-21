import os
import sys
import traceback
from dotenv import load_dotenv

# Charger les variables d'environnement depuis le fichier .env
load_dotenv()

print("--- DÉMARRAGE REPORT SERVICE ---", file=sys.stderr)

try:
    # On essaie d'importer la factory depuis app/ au lieu de src/
    from app import create_app
    print("Import 'app.create_app' réussi.", file=sys.stderr)
    
    # On crée l'application
    config_name = os.getenv('FLASK_CONFIG') or 'default'
    print(f"Configuration: {config_name}", file=sys.stderr)
    
    application = create_app(config_name)
    
    # CRUCIAL : On crée l'alias 'app' car votre docker-compose cherche 'app:app'
    app = application
    print("Application Flask créée avec succès.", file=sys.stderr)
    if __name__ == '__main__':
        # Configuration pour Windows (Local)
        # On remplace 'school-db' par 'localhost' car Windows ne connait pas le réseau Docker
        if 'school-db' in app.config['SQLALCHEMY_DATABASE_URI']:
            print("Mode Local détecté : Connexion à localhost...")
            app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLALCHEMY_DATABASE_URI'].replace('school-db', 'localhost')

        # Lancer le serveur Flask
        app.run(host='0.0.0.0', port=5000, debug=True)
except ImportError as e:
    print(f"ERREUR D'IMPORT CRITIQUE : {e}", file=sys.stderr)
    print("Vérifiez que 'flask_sqlalchemy' est bien installé.", file=sys.stderr)
    traceback.print_exc()
    raise e
except Exception as e:
    print(f"ERREUR AU DÉMARRAGE : {e}", file=sys.stderr)
    traceback.print_exc()
    raise e