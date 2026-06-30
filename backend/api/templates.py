from flask import jsonify
from . import api_bp

# Predefined templates metadata
TEMPLATES = [
    {"id": "modern", "name": "Modern", "category": "Modern", "description": "Asymmetric layout with elegant left accent sidebar.", "color": "#1e3a8a"},
    {"id": "professional", "name": "Professional", "category": "Professional", "description": "Clean, structured grids with solid banners.", "color": "#0f172a"},
    {"id": "harvard", "name": "Harvard", "category": "Academic", "description": "Centered elegant serif layout matching traditional academic standards.", "color": "#7f1d1d"},
    {"id": "stanford", "name": "Stanford", "category": "Academic", "description": "Minimal serif headers with italic timeline labels.", "color": "#8c1515"},
    {"id": "corporate", "name": "Corporate", "category": "Professional", "description": "Bold borders and clear divider headers for executives.", "color": "#1e40af"},
    {"id": "creative", "name": "Creative", "category": "Creative", "description": "Vibrant custom accents and clean profile visual cards.", "color": "#db2777"},
    {"id": "minimal", "name": "Minimal", "category": "Minimal", "description": "Ultra-clean high whitespace template focusing on contents.", "color": "#18181b"},
    {"id": "google", "name": "Google Style", "category": "Tech", "description": "No-nonsense monospace/sans font following Google engineer standards.", "color": "#4b5563"},
    {"id": "microsoft", "name": "Microsoft Style", "category": "Corporate", "description": "Clean modern typography with Segoe UI and layout lines.", "color": "#0078d4"},
    {"id": "amazon", "name": "Amazon Style", "category": "Corporate", "description": "Compact structures designed to emphasize deliverables and metrics.", "color": "#ff9900"},
    {"id": "ai_engineer", "name": "AI Engineer", "category": "Tech", "description": "Double columns for structured skill matrices and code repos.", "color": "#7c3aed"},
    {"id": "medical", "name": "Medical Coding", "category": "Specialized", "description": "Clear sections focusing on certifications and clinical exposures.", "color": "#0891b2"},
    {"id": "fresher", "name": "Fresher", "category": "Entry Level", "description": "Large summary objective section leading into education & projects.", "color": "#059669"},
    {"id": "developer", "name": "Software Developer", "category": "Tech", "description": "Clear display for GitHub, web portfolios, and framework stacks.", "color": "#0284c7"},
    {"id": "data_analyst", "name": "Data Analyst", "category": "Tech", "description": "Visual details for technical tools split by level of competence.", "color": "#d97706"}
]

@api_bp.route('/templates', methods=['GET'])
def get_templates_metadata():
    return jsonify(TEMPLATES), 200
