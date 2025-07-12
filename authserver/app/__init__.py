from flask import Flask
from .models import db
from .routes import auth_bp
from .telemetry_routes import telemetry_bp
from config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    app.register_blueprint(auth_bp)
    app.register_blueprint(telemetry_bp, url_prefix='/telemetry')

    with app.app_context():
        db.create_all()

    return app
