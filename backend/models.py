import datetime
from database import db
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    resumes = db.relationship('Resume', backref='user', lazy=True, cascade="all, delete-orphan")
    cover_letters = db.relationship('CoverLetter', backref='user', lazy=True, cascade="all, delete-orphan")
    ai_usages = db.relationship('AIUsage', backref='user', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'is_admin': self.is_admin,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat()
        }

class Resume(db.Model):
    __tablename__ = 'resumes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    template_name = db.Column(db.String(100), default='modern')
    
    # Store complete structured resume details in a JSON field
    # { personal: {}, education: [], experience: [], skills: [], projects: [], certificates: [], languages: [], achievements: [] }
    content = db.Column(db.JSON, nullable=False)
    
    # Store customized styles (font, spacing, margins, color theme)
    # { font_family: 'Inter', font_size: 'medium', colors: { primary: '#1e3a8a', accent: '#3b82f6' }, spacing: 'normal' }
    custom_styling = db.Column(db.JSON, nullable=True)
    
    ats_score = db.Column(db.Integer, default=0)
    is_public = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    ats_reports = db.relationship('ATSReport', backref='resume', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'template_name': self.template_name,
            'content': self.content,
            'custom_styling': self.custom_styling or {},
            'ats_score': self.ats_score,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class CoverLetter(db.Model):
    __tablename__ = 'cover_letters'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    job_title = db.Column(db.String(150), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'job_title': self.job_title,
            'content': self.content,
            'created_at': self.created_at.isoformat()
        }

class ATSReport(db.Model):
    __tablename__ = 'ats_reports'
    
    id = db.Column(db.Integer, primary_key=True)
    resume_id = db.Column(db.Integer, db.ForeignKey('resumes.id'), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    
    # JSON array of suggestions
    issues = db.Column(db.JSON, nullable=False)
    
    # JSON array of found keywords vs target keywords
    keywords_found = db.Column(db.JSON, nullable=False)
    match_percentage = db.Column(db.Integer, default=0)
    checked_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'resume_id': self.resume_id,
            'score': self.score,
            'issues': self.issues,
            'keywords_found': self.keywords_found,
            'match_percentage': self.match_percentage,
            'checked_at': self.checked_at.isoformat()
        }

class AIUsage(db.Model):
    __tablename__ = 'ai_usages'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action_type = db.Column(db.String(100), nullable=False)  # 'summary_gen', 'bullets_opt', 'skills_gen', 'cover_letter'
    token_count = db.Column(db.Integer, default=0)
    used_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action_type': self.action_type,
            'token_count': self.token_count,
            'used_at': self.used_at.isoformat()
        }
