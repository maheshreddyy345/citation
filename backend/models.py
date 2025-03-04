from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    bibliographies = db.relationship('Bibliography', backref='user', lazy=True)

class Bibliography(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    citations = db.relationship('Citation', backref='bibliography', lazy=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Citation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    source_type = db.Column(db.String(50), nullable=False)
    style = db.Column(db.String(50), nullable=False)
    citation_text = db.Column(db.Text, nullable=False)
    source_data = db.Column(db.JSON, nullable=False)
    bibliography_id = db.Column(db.Integer, db.ForeignKey('bibliography.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
