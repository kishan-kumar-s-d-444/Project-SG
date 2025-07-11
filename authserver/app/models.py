from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class ConnectedCar(db.Model):
    """Represents any connected/autonomous vehicle"""
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.String(100), unique=True, nullable=False)
    client_secret = db.Column(db.String(100), nullable=False)
    vin = db.Column(db.String(17), unique=True, nullable=False)
    model = db.Column(db.String(100))
    year = db.Column(db.Integer)
    scopes = db.Column(db.String(1000))  # Available permissions
    scope_categories = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_authorized = db.Column(db.DateTime)

class CarAuthCode(db.Model):
    """Temporary authorization codes for vehicles"""
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(100), unique=True, nullable=False)
    client_id = db.Column(db.String(100), nullable=False)
    vin = db.Column(db.String(17), nullable=False)
    scope = db.Column(db.String(500))
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    ip_address = db.Column(db.String(45))
