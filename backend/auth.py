from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from models import db, User

auth = Blueprint('auth', __name__)

SECRET_KEY = 'your-secret-key'  # In production, use environment variable

def generate_token(user_id):
    return jwt.encode(
        {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(days=7)
        },
        SECRET_KEY,
        algorithm='HS256'
    )

@auth.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400
        
    user = User(
        email=email,
        password=generate_password_hash(password, method='pbkdf2:sha256')
    )
    
    try:
        db.session.add(user)
        db.session.commit()
        
        token = generate_token(user.id)
        
        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create user'}), 500

@auth.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
            
        user = User.query.filter_by(email=email).first()
        
        if not user or not check_password_hash(user.password, password):
            return jsonify({'error': 'Invalid email or password'}), 401
            
        token = generate_token(user.id)
        
        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email
            }
        })
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

@auth.route('/profile')
def profile():
    try:
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({'error': 'No token provided'}), 401
            
        token = token.split(' ')[1]
        
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            user = User.query.get(data['user_id'])
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
                
            return jsonify({
                'user': {
                    'id': user.id,
                    'email': user.email
                }
            })
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
            
    except Exception as e:
        print(f"Profile error: {str(e)}")
        return jsonify({'error': 'Failed to get profile'}), 500

@auth.route('/logout')
def logout():
    return jsonify({'message': 'Logged out successfully'})
