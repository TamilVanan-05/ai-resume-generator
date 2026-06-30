from flask import request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from database import db
from models import User
from . import auth_bp
from .utils import generate_verification_code, send_verification_email, send_password_reset_email

# Dictionary to temporarily store verification codes in-memory
# format: { email: { 'code': code, 'temp_user_data': {...} } }
pending_verifications = {}
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
        return jsonify({'message': 'Email already registered'}), 409
        
    # Generate verification code
    code = generate_verification_code()
    
    # Store temporary signup data in memory
    pending_verifications[email] = {
        'code': code,
        'name': name,
        'password': password
    }
    
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
        
    pending = pending_verifications.get(email)
    if not pending or pending['code'] != code:
        return jsonify({'message': 'Invalid verification code or email'}), 400
        
    # Create the user in the database
    user = User(
        name=pending['name'],
        email=email,
        is_verified=True
    )
    user.set_password(pending['password'])
    
    # Set first user as admin automatically
    first_user = User.query.first()
    if not first_user:
        user.is_admin = True
        
    db.session.add(user)
    db.session.commit()
    
    # Clean up pending
    pending_verifications.pop(email, None)
    
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
        pending_verifications[email] = {
            'code': code,
            'name': user.name,
            'password': password  # Simple re-sync
        }
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
