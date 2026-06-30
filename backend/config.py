import os
from datetime import timedelta
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'ai-resume-generator-secret-2026')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-resume-super-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # DB configuration: SQLite as default for development, supports MySQL string
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        # Fallback to local SQLite inside the backend folder
        base_dir = os.path.abspath(os.path.dirname(__file__))
        database_url = f"sqlite:///{os.path.join(base_dir, 'resume_app.db')}"
    
    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Gemini API settings
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
    
    # Mail Config (for verification simulation)
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@airesumebuilder.com')
