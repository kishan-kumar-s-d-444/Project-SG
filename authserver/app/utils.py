import jwt
from datetime import datetime, timedelta
import secrets
from flask import current_app

def generate_car_auth_code():
    """Generate secure authorization code"""
    return secrets.token_urlsafe(32)

def generate_car_access_token(client_id, vin, scope):
    """Generate JWT token with car-specific claims"""
    headers = {
        'kid': 'car-auth-key-1',  # Key identifier for the signing key
        'typ': 'JWT'
    }
    payload = {
        'client_id': client_id,
        'vin': vin,
        'scope': scope,
        'exp': datetime.utcnow() + timedelta(hours=1),
        'iat': datetime.utcnow(),
        'token_type': 'car_access'
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256', headers=headers)

def verify_car_credentials(vin, scope):
    """Verify car credentials and requested scope"""
    return {
        'verified': True,
        'vin': vin,
        'scope': scope,
        'status': 'active'
    }

def get_scope_category(scope):
    """Get the category of a specific scope"""
    categories = {
        'basic_operations': ['engine_start', 'engine_stop', 'door_lock', 'door_unlock', 'trunk_access', 'horn_control', 'light_control'],
        'climate': ['climate_control', 'temperature_set', 'ac_control', 'heater_control', 'defrost_control', 'fan_control'],
        'vehicle_status': ['battery_status', 'fuel_status', 'tire_pressure', 'oil_status', 'diagnostic_basic', 'diagnostic_full'],
        'location': ['location_access', 'location_history', 'geofence_set', 'route_planning', 'navigation_control'],
        'connectivity': ['ota_update', 'wifi_control', 'bluetooth_control', 'mobile_app_sync'],
        'safety': ['alarm_control', 'emergency_call', 'crash_detection', 'theft_alert', 'valet_mode'],
        'driver_assistance': ['parking_assist', 'lane_control', 'cruise_control', 'speed_limit', 'driver_assist_settings'],
        'entertainment': ['media_control', 'audio_settings', 'display_settings', 'passenger_entertainment'],
        'preferences': ['seat_control', 'mirror_control', 'profile_management', 'driving_mode'],
        'maintenance': ['service_schedule', 'maintenance_history', 'repair_status', 'recall_info'],
        'data': ['telemetry_basic', 'telemetry_advanced', 'usage_statistics', 'efficiency_metrics']
    }
    
    for category, scopes in categories.items():
        if scope in scopes:
            return category
    return None

def validate_car_scope(requested_scope, allowed_scopes):
    """Enhanced validation of requested scopes against allowed scopes"""
    if not requested_scope or not allowed_scopes:
        return False
        
    requested = set(requested_scope.split())
    allowed = set(allowed_scopes.split())
    
    # Check if all requested scopes are allowed
    if not requested.issubset(allowed):
        return False
        
    # Additional validation for scope categories
    requested_categories = {get_scope_category(scope) for scope in requested}
    allowed_categories = {get_scope_category(scope) for scope in allowed}
    
    return None not in requested_categories and requested_categories.issubset(allowed_categories)
