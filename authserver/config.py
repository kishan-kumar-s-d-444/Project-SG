import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Basic Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY')
    
    # Database Configuration
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///car_oauth.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # OAuth Configuration
    TOKEN_EXPIRES_IN = 3600  # Access token expiry (1 hour)
    AUTH_CODE_EXPIRES_IN = 600  # Authorization code expiry (10 minutes)
    
    # Car-specific Configuration
    ALLOWED_SCOPES = [
        # Basic Vehicle Operations
        'engine_start',
        'engine_stop',
        'door_lock',
        'door_unlock',
        'trunk_access',
        'horn_control',
        'light_control',

        # Climate Control
        'climate_control',
        'temperature_set',
        'ac_control',
        'heater_control',
        'defrost_control',
        'fan_control',

        # Vehicle Status
        'battery_status',
        'fuel_status',
        'tire_pressure',
        'oil_status',
        'diagnostic_basic',
        'diagnostic_full',

        # Location Services
        'location_access',
        'location_history',
        'geofence_set',
        'route_planning',
        'navigation_control',

        # Connectivity
        'ota_update',
        'wifi_control',
        'bluetooth_control',
        'mobile_app_sync',

        # Safety & Security
        'alarm_control',
        'emergency_call',
        'crash_detection',
        'theft_alert',
        'valet_mode',

        # Advanced Driver Assistance
        'parking_assist',
        'lane_control',
        'cruise_control',
        'speed_limit',
        'driver_assist_settings',

        # Entertainment
        'media_control',
        'audio_settings',
        'display_settings',
        'passenger_entertainment',

        # User Preferences
        'seat_control',
        'mirror_control',
        'profile_management',
        'driving_mode',

        # Maintenance
        'service_schedule',
        'maintenance_history',
        'repair_status',
        'recall_info',

        # Data Access
        'telemetry_basic',
        'telemetry_advanced',
        'usage_statistics',
        'efficiency_metrics'
    ]
    
    # Security Configuration
    MAX_AUTH_ATTEMPTS = 3
    MIN_SECRET_LENGTH = 16
    
    # Rate Limiting
    RATE_LIMIT = "100 per hour"
