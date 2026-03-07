import os

def _build_db_uri():
    """Construire l'URI de base de données depuis les variables d'environnement"""
    # Priorité à DATABASE_URL
    uri = os.environ.get('DATABASE_URL')
    if uri:
        if uri.startswith('postgres://'):
            uri = uri.replace('postgres://', 'postgresql://', 1)
        return uri

    # Sinon construire depuis les variables individuelles
    host     = os.environ.get('DATABASE_HOST', 'postgres')
    port     = os.environ.get('DATABASE_PORT', '5432')
    user     = os.environ.get('DATABASE_USER', 'admin')
    password = os.environ.get('DATABASE_PASSWORD', 'admin')
    dbname   = os.environ.get('DATABASE_NAME', 'scolarite_db')

    return f'postgresql://{user}:{password}@{host}:{port}/{dbname}'


class Config:
    SQLALCHEMY_DATABASE_URI = _build_db_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'igr-report-secret-key')
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB

class ProductionConfig(Config):
    DEBUG = False

class DevelopmentConfig(Config):
    DEBUG = True

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
