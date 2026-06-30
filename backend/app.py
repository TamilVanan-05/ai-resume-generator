import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from database import db
from config import Config
from auth import auth_bp
from api import api_bp

def create_app():
    # Set static folder to serve frontend direct files
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))
    
    app = Flask(__name__, static_folder=frontend_dir, static_url_path='')
    app.config.from_object(Config)
    
    # Initialize extensions
    CORS(app)
    JWTManager(app)
    db.init_app(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Create tables automatically in development
    with app.app_context():
        db.create_all()
        
    # --- Frontend Routing handlers ---
    @app.route('/')
    def serve_index():
        return send_from_directory(app.static_folder, 'index.html')
        
    @app.route('/auth')
    def serve_auth():
        return send_from_directory(app.static_folder, 'auth.html')
        
    @app.route('/dashboard')
    def serve_dashboard():
        return send_from_directory(app.static_folder, 'dashboard.html')
        
    @app.route('/editor')
    def serve_editor():
        return send_from_directory(app.static_folder, 'editor.html')
        
    @app.route('/admin')
    def serve_admin():
        return send_from_directory(app.static_folder, 'admin.html')
        
    @app.route('/templates')
    def serve_templates():
        return send_from_directory(app.static_folder, 'templates.html')
        
    @app.route('/share/<int:resume_id>')
    def serve_share(resume_id):
        return send_from_directory(app.static_folder, 'share.html')
        
    # Catch-all for assets or sub-folders
    @app.route('/<path:path>')
    def serve_static(path):
        return send_from_directory(app.static_folder, path)
        
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
