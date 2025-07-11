from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
from .models import db, ConnectedCar, CarAuthCode
from .utils import (
    generate_car_auth_code,
    generate_car_access_token,
    verify_car_credentials,
    validate_car_scope
)

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/authorize', methods=['POST'])
def authorize_car():
    """First step: Car requests authorization"""
    try:
        data = request.get_json()
        client_id = data.get('client_id')
        client_secret = data.get('client_secret')
        scope = data.get('scope')
        
        # Find car in database
        car = ConnectedCar.query.filter_by(client_id=client_id).first()
        if not car or car.client_secret != client_secret:
            return jsonify({'error': 'Invalid car credentials'}), 401

        # Validate requested scope
        if not validate_car_scope(scope, car.scopes):
            return jsonify({'error': 'Invalid scope for this vehicle'}), 400

        
        # Generate authorization code
        auth_code = generate_car_auth_code()
        new_code = CarAuthCode(
            code=auth_code,
            client_id=client_id,
            vin=car.vin,
            scope=scope,
            expires_at=datetime.utcnow() + timedelta(minutes=10),
            ip_address=request.remote_addr
        )
        
        db.session.add(new_code)
        db.session.commit()

        return jsonify({
            'code': auth_code,
            'expires_in': 600
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/token', methods=['POST'])
def car_token():
    """Second step: Exchange auth code for access token"""
    try:
        code = request.form.get('code')
        client_id = request.form.get('client_id')
        client_secret = request.form.get('client_secret')

        # Verify car
        car = ConnectedCar.query.filter_by(client_id=client_id).first()
        if not car or car.client_secret != client_secret:
            return jsonify({'error': 'Invalid car credentials'}), 401

        # Verify authorization code
        auth_code = CarAuthCode.query.filter_by(
            code=code,
            client_id=client_id,
            used=False
        ).first()

        if not auth_code or auth_code.expires_at < datetime.utcnow():
            return jsonify({'error': 'Invalid or expired code'}), 400

        # Mark code as used
        auth_code.used = True
        car.last_authorized = datetime.utcnow()
        db.session.commit()

        # Generate access token
        access_token = generate_car_access_token(
            client_id=client_id,
            vin=car.vin,
            scope=auth_code.scope
        )

        return jsonify({
            'access_token': access_token,
            'token_type': 'Bearer',
            'expires_in': 3600,
            'scope': auth_code.scope,
            'vehicle_info': {
                'vin': car.vin,
                'model': car.model,
                'year': car.year
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
