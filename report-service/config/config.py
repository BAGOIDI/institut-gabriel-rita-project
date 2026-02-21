import os

class Config:
    
    # Tentative de récupération de l'URL
    uri = os.environ.get('DATABASE_URL')
    
    # Si l'URL commence par 'postgres://' (ancien format Heroku/SQLAlchemy), on le corrige en 'postgresql://'
    if uri and uri.startswith('postgres://'):
        uri = uri.replace('postgres://', 'postgresql://', 1)
        
    # Si aucune URL n'est fournie, on utilise une valeur par défaut pour éviter le crash
    if not uri:
        # Valeur par défaut basée sur votre docker-compose
        uri = 'postgresql://postgres:postgres@school-db:5432/institut_gabriel_rita_db'
        print(f"ATTENTION: DATABASE_URL non trouvée. Utilisation de la valeur par défaut: {uri}")

    SQLALCHEMY_DATABASE_URI = uri
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class ProductionConfig(Config):
    DEBUG = False

class DevelopmentConfig(Config):
    DEBUG = True

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
