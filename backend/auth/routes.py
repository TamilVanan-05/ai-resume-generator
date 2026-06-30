from flask import request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from database import db
from models import User
from . import auth_bp
from .utils import generate_verification_code, send_verification_email, send_password_reset_email

reset_tokens = {}

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not name or not email or not password:
        return jsonify({'message': 'Missing required fields'}), 400
        
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        if existing_user.is_verified:
            return jsonify({'message': 'Email already registered'}), 409
        else:
            # Update password and name for unverified user registration re-attempt
            existing_user.name = name
            existing_user.set_password(password)
            code = generate_verification_code()
            existing_user.verification_code = code
            db.session.commit()
            send_verification_email(email, code)
            return jsonify({
                'message': 'Signup updated. A new verification code has been sent to your email.',
                'email': email,
                'dev_bypass_code': code
            }), 200
        
    # Generate verification code
    code = generate_verification_code()
    
    # Store unverified user directly in the database
    user = User(
        name=name,
        email=email,
        is_verified=False,
        verification_code=code
    )
    user.set_password(password)
    
    db.session.add(user)
    db.session.commit()
    
    # Send simulated verification email
    send_verification_email(email, code)
    
    return jsonify({
        'message': 'Signup initiated. A verification code has been sent to your email.',
        'email': email,
        'dev_bypass_code': code  # Included for easy testing in UI without reading console logs!
    }), 200

@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    data = request.get_json() or {}
    email = data.get('email')
    code = data.get('code')
    
    if not email or not code:
        return jsonify({'message': 'Missing email or verification code'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or user.verification_code != code:
        return jsonify({'message': 'Invalid verification code or email'}), 400
        
    # Set user status verified
    user.is_verified = True
    user.verification_code = None
    
    # Set first verified user as admin automatically
    admin_count = User.query.filter_by(is_admin=True, is_verified=True).count()
    if admin_count == 0:
        user.is_admin = True
        
    db.session.commit()
    
    # Generate login token
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Email verified successfully. Account created.',
        'access_token': access_token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Missing email or password'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid credentials'}), 401
        
    if not user.is_verified:
        # Re-send verification code if user registered but is not verified
        code = generate_verification_code()
        user.verification_code = code
        db.session.commit()
        send_verification_email(email, code)
        return jsonify({
            'message': 'Account not verified. Verification email resent.',
            'email': email,
            'dev_bypass_code': code,
            'requires_verification': True
        }), 200
        
    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email')
    
    if not email:
        return jsonify({'message': 'Missing email'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user:
        # Prevent user enumeration, return success even if email not found
        return jsonify({'message': 'If the email exists, a password reset link has been sent.'}), 200
        
    reset_token = generate_verification_code(8)
    reset_tokens[reset_token] = email
    
    send_password_reset_email(email, reset_token)
    
    return jsonify({
        'message': 'Password reset link sent.',
        'dev_bypass_token': reset_token
    }), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    token = data.get('token')
    new_password = data.get('new_password')
    
    if not token or not new_password:
        return jsonify({'message': 'Missing token or new password'}), 400
        
    email = reset_tokens.get(token)
    if not email:
        return jsonify({'message': 'Invalid or expired reset token'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    user.set_password(new_password)
    db.session.commit()
    
    # Remove used token
    reset_tokens.pop(token, None)
    
    return jsonify({'message': 'Password updated successfully.'}), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    data = request.get_json() or {}
    name = data.get('name')
    password = data.get('password')
    
    if name:
        user.name = name
    if password:
        user.set_password(password)
        
    db.session.commit()
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200
