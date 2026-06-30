from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, Resume, AIUsage, ATSReport
from . import api_bp
from sqlalchemy import func

def verify_admin(user_id):
    user = User.query.get(user_id)
    return user and user.is_admin

# --- Admin Monitoring & Moderation Endpoints ---

@api_bp.route('/admin/dashboard', methods=['GET'])
@jwt_required()
def admin_dashboard_stats():
    user_id = int(get_jwt_identity())
    if not verify_admin(user_id):
        return jsonify({'message': 'Admin privilege required'}), 403
        
    total_users = User.query.count()
    total_resumes = Resume.query.count()
    
    # Calculate AI statistics
    ai_actions_count = AIUsage.query.count()
    ai_tokens_total = db.session.query(func.sum(AIUsage.token_count)).scalar() or 0
    
    # Template popularity list
    templates_stats = db.session.query(
        Resume.template_name, func.count(Resume.id)
    ).group_by(Resume.template_name).all()
    
    template_popularity = {t[0]: t[1] for t in templates_stats}
    
    # Recent users
    recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
    
    # Score distribution stats
    avg_ats = db.session.query(func.avg(Resume.ats_score)).scalar() or 0
    
    return jsonify({
        'stats': {
            'total_users': total_users,
            'total_resumes': total_resumes,
            'ai_queries_run': ai_actions_count,
            'total_tokens_consumed': ai_tokens_total,
            'average_ats_score': round(float(avg_ats), 1)
        },
        'template_popularity': template_popularity,
        'recent_users': [u.to_dict() for u in recent_users]
    }), 200

@api_bp.route('/admin/users', methods=['GET'])
@jwt_required()
def admin_get_users():
    user_id = int(get_jwt_identity())
    if not verify_admin(user_id):
        return jsonify({'message': 'Admin privilege required'}), 403
        
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users]), 200

@api_bp.route('/admin/users/<int:target_user_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_user(target_user_id):
    user_id = int(get_jwt_identity())
    if not verify_admin(user_id):
        return jsonify({'message': 'Admin privilege required'}), 403
        
    if target_user_id == user_id:
        return jsonify({'message': 'Cannot delete your own admin account'}), 400
        
    target_user = User.query.get(target_user_id)
    if not target_user:
        return jsonify({'message': 'User not found'}), 404
        
    db.session.delete(target_user)
    db.session.commit()
    return jsonify({'message': 'User and all associated data deleted successfully'}), 200

@api_bp.route('/admin/resumes', methods=['GET'])
@jwt_required()
def admin_get_resumes():
    user_id = int(get_jwt_identity())
    if not verify_admin(user_id):
        return jsonify({'message': 'Admin privilege required'}), 403
        
    resumes = Resume.query.order_by(Resume.updated_at.desc()).all()
    result = []
    for r in resumes:
        r_dict = r.to_dict()
        # Attach user name for administrative context
        r_dict['user_name'] = r.user.name if r.user else "Deleted User"
        result.append(r_dict)
    return jsonify(result), 200

@api_bp.route('/admin/resumes/<int:target_resume_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_resume(target_resume_id):
    user_id = int(get_jwt_identity())
    if not verify_admin(user_id):
        return jsonify({'message': 'Admin privilege required'}), 403
        
    target_resume = Resume.query.get(target_resume_id)
    if not target_resume:
        return jsonify({'message': 'Resume not found'}), 404
        
    db.session.delete(target_resume)
    db.session.commit()
    return jsonify({'message': 'Resume deleted successfully'}), 200
