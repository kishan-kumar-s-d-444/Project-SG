from flask import Flask, request, jsonify, send_file
from web3 import Web3
import json
import secrets
import logging
import hashlib
import os
import jwt
from functools import wraps
from dotenv import load_dotenv
import threading
import time
import random
from datetime import datetime, timedelta
import copy
import sqlite3

# Initialize Flask app
app = Flask(__name__)

# Load environment variables
load_dotenv()

# Configure app
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Web3 configuration
w3 = Web3(Web3.HTTPProvider('http://localhost:8545'))

# Load contract ABI and address
with open('contract.json', 'r') as f:
    contract_data = json.load(f)
CONTRACT_ADDRESS = contract_data['address']
CONTRACT_ABI = contract_data['abi']

def load_contract():
    """Load the smart contract instance"""
    try:
        contract = w3.eth.contract(
            address=CONTRACT_ADDRESS,
            abi=CONTRACT_ABI
        )
        logger.info(f"Contract loaded successfully at {CONTRACT_ADDRESS}")
        return contract
    except Exception as e:
        logger.error(f"Error loading contract: {str(e)}")
        return None

# Load contract at startup
contract = load_contract()

# Auth server configuration - use app.config for secret key
AUTH_SERVER_SECRET = app.config['SECRET_KEY']  # Use same secret as auth server

def verify_auth_token(token):
    """Verify the JWT token from the auth server"""
    try:
        logger.info(f"Verifying token with secret: {app.config['SECRET_KEY']}")
        
        # Extract token from Authorization header
        if token.startswith('Bearer '):
            token = token.split(' ')[1]
        
        # Get unverified headers first
        headers = jwt.get_unverified_header(token)
        logger.info(f"Token headers: {headers}")
        
        # Get unverified payload for debugging
        try:
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            logger.info(f"Unverified payload: {unverified_payload}")
        except Exception as e:
            logger.error(f"Error decoding unverified payload: {str(e)}")
        
        # Verify token with the auth server's secret key
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        logger.info(f"Verified payload: {payload}")
        
        # Verify required claims
        if not all(k in payload for k in ['client_id', 'vin', 'scope']):
            logger.error("Token missing required claims")
            return None
            
        # Verify token type
        if payload.get('token_type') != 'car_access':
            logger.error("Invalid token type")
            return None
            
        # Verify kid in header (optional)
        if 'kid' not in headers or headers['kid'] != 'car-auth-key-1':
            logger.warning("Token missing or has invalid kid")
            
        return payload
        
    except jwt.ExpiredSignatureError:
        logger.error("Token has expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid token: {str(e)}")
        return None

def requires_auth(f):
    """Decorator to require JWT authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid Authorization header'}), 401
            
        token = auth_header.split(' ')[1]
        payload = verify_auth_token(token)
        
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
            
        # Add verified claims to request context
        request.auth_claims = payload
        return f(*args, **kwargs)
    return decorated

# Dummy telemetry data
TELEMETRY_DATA = {
    'tesla_models_1': {
        'vehicle_type': 'Tesla Model S 2023',
        'speed': 65,
        'battery_level': 75,
        'engine_temp': 90,
        'tire_pressure': {
            'front_left': 32,
            'front_right': 32,
            'rear_left': 32,
            'rear_right': 32
        },
        'location': {
            'latitude': 37.7749,
            'longitude': -122.4194
        },
        'maintenance': {
            'next_service': '2025-03-15',
            'battery_health': '95%',
            'brake_pad_wear': '85%'
        }
    },
    'tesla_models_2': {
        'vehicle_type': 'Tesla Model S 2024',
        'speed': 70,
        'battery_level': 85,
        'engine_temp': 88,
        'tire_pressure': {
            'front_left': 33,
            'front_right': 33,
            'rear_left': 33,
            'rear_right': 33
        },
        'location': {
            'latitude': 34.0522,
            'longitude': -118.2437
        },
        'maintenance': {
            'next_service': '2025-04-20',
            'battery_health': '98%',
            'brake_pad_wear': '92%'
        }
    },
    'tesla_model3_1': {
        'vehicle_type': 'Tesla Model 3 2023',
        'speed': 55,
        'battery_level': 60,
        'engine_temp': 85,
        'tire_pressure': {
            'front_left': 31,
            'front_right': 31,
            'rear_left': 31,
            'rear_right': 31
        },
        'location': {
            'latitude': 40.7128,
            'longitude': -74.0060
        },
        'maintenance': {
            'next_service': '2025-02-28',
            'battery_health': '92%',
            'brake_pad_wear': '88%'
        }
    },
    'tesla_modelx_1': {
        'vehicle_type': 'Tesla Model X 2023',
        'speed': 75,
        'battery_level': 80,
        'engine_temp': 87,
        'tire_pressure': {
            'front_left': 35,
            'front_right': 35,
            'rear_left': 35,
            'rear_right': 35
        },
        'location': {
            'latitude': 51.5074,
            'longitude': -0.1278
        },
        'maintenance': {
            'next_service': '2025-05-15',
            'battery_health': '96%',
            'brake_pad_wear': '90%'
        }
    },
    'tesla_modely_1': {
        'vehicle_type': 'Tesla Model Y 2023',
        'speed': 60,
        'battery_level': 70,
        'engine_temp': 86,
        'tire_pressure': {
            'front_left': 34,
            'front_right': 34,
            'rear_left': 34,
            'rear_right': 34
        },
        'location': {
            'latitude': 48.8566,
            'longitude': 2.3522
        },
        'maintenance': {
            'next_service': '2025-06-01',
            'battery_health': '94%',
            'brake_pad_wear': '89%'
        }
    }
}

# Add more entries for tesla_models_3 through tesla_modely_20
for model in ['models', 'model3', 'modelx', 'modely']:
    for i in range(3, 21):  # Starting from 3 since we already have 1 and 2
        client_id = f'tesla_{model}_{i}'
        TELEMETRY_DATA[client_id] = {
            'vehicle_type': f'Tesla {model.upper()} {2023 + (i % 3)}',  # Cycle through years 2023-2025
            'speed': 50 + (i * 2) % 30,  # Varies between 50-80
            'battery_level': 60 + (i * 5) % 40,  # Varies between 60-100
            'engine_temp': 85 + (i * 2) % 10,  # Varies between 85-95
            'tire_pressure': {
                'front_left': 32 + (i % 4),
                'front_right': 32 + (i % 4),
                'rear_left': 32 + (i % 4),
                'rear_right': 32 + (i % 4)
            },
            'location': {
                'latitude': 35.0 + (i * 2.5) % 30,
                'longitude': -115.0 + (i * 5) % 70
            },
            'maintenance': {
                'next_service': f'2025-{((i % 12) + 1):02d}-{(i % 28) + 1:02d}',
                'battery_health': f'{90 + (i * 2) % 10}%',
                'brake_pad_wear': f'{85 + (i * 3) % 15}%'
            }
        }

# Add file verification functions
def calculate_file_hash(file_path):
    """Calculate SHA3 hash of a file"""
    sha3_hash = hashlib.sha3_256()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            sha3_hash.update(chunk)
    return '0x' + sha3_hash.hexdigest()

@app.route('/get-nonce')
def get_nonce():
    """Generate a random nonce for request signing"""
    try:
        nonce = secrets.token_hex(32)
        logger.info(f"Generated new nonce: {nonce}")
        return jsonify({'nonce': nonce})
    except Exception as e:
        logger.error(f"Error generating nonce: {str(e)}")
        return jsonify({'error': 'Failed to generate nonce'}), 500

def init_db():
    """Initialize SQLite database"""
    conn = sqlite3.connect('telemetry.db')
    c = conn.cursor()
    
    # Create table for telemetry data
    c.execute('''
        CREATE TABLE IF NOT EXISTS telemetry (
            client_id TEXT PRIMARY KEY,
            data JSON
        )
    ''')
    
    # Initialize with default data if empty
    c.execute('SELECT COUNT(*) FROM telemetry')
    if c.fetchone()[0] == 0:
        # Insert initial TELEMETRY_DATA
        for client_id, data in TELEMETRY_DATA.items():
            c.execute('INSERT INTO telemetry (client_id, data) VALUES (?, ?)',
                     (client_id, json.dumps(data)))
    
    conn.commit()
    conn.close()

def get_telemetry_from_db(client_id):
    """Get telemetry data for a specific client from database"""
    conn = sqlite3.connect('telemetry.db')
    c = conn.cursor()
    c.execute('SELECT data FROM telemetry WHERE client_id = ?', (client_id,))
    result = c.fetchone()
    conn.close()
    return json.loads(result[0]) if result else None

def update_telemetry_in_db(client_id, data):
    """Update telemetry data for a specific client in database"""
    conn = sqlite3.connect('telemetry.db')
    c = conn.cursor()
    c.execute('UPDATE telemetry SET data = ? WHERE client_id = ?',
             (json.dumps(data), client_id))
    conn.commit()
    conn.close()

def update_telemetry_data():
    """Background task to update telemetry data every minute"""
    while True:
        try:
            conn = sqlite3.connect('telemetry.db')
            c = conn.cursor()
            c.execute('SELECT client_id, data FROM telemetry')
            all_data = c.fetchall()
            
            for client_id, data_json in all_data:
                # Parse the stored JSON data
                data = json.loads(data_json)
                
                # Randomly update values (same logic as before)
                data['speed'] = random.randint(0, 120)
                data['battery_level'] = max(5, min(100, data['battery_level'] + random.randint(-5, 5)))
                data['engine_temp'] = random.randint(80, 95)
                
                for tire in data['tire_pressure']:
                    data['tire_pressure'][tire] = round(random.uniform(30, 36), 1)
                
                data['location']['latitude'] += random.uniform(-0.05, 0.05)
                data['location']['longitude'] += random.uniform(-0.05, 0.05)
                
                battery_health = int(data['maintenance']['battery_health'].rstrip('%'))
                brake_pad_wear = int(data['maintenance']['brake_pad_wear'].rstrip('%'))
                
                data['maintenance']['battery_health'] = f"{max(70, min(100, battery_health + random.randint(-1, 1)))}%"
                data['maintenance']['brake_pad_wear'] = f"{max(60, min(100, brake_pad_wear + random.randint(-1, 1)))}%"
                
                # Update in database
                c.execute('UPDATE telemetry SET data = ? WHERE client_id = ?',
                         (json.dumps(data), client_id))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Telemetry data updated in database at {datetime.now()}")
            time.sleep(60)  # Wait for 1 minute
            
        except Exception as e:
            logger.error(f"Error updating telemetry data: {str(e)}")
            time.sleep(60)  # Wait before retrying

# Modify the get_telemetry route to use database
@app.route('/mercedes/telemetry/<path:endpoint>', methods=['GET'])
def get_telemetry(endpoint):
    """Get telemetry data with blockchain-based access control"""
    try:
        # Get and validate headers
        nonce = request.headers.get('X-Nonce')
        signature = request.headers.get('X-Signature')
        
        logger.info(f"Received request for endpoint: {endpoint}")
        logger.info(f"Nonce: {nonce}")
        logger.info(f"Signature: {signature}")
        
        if not nonce or not signature:
            logger.error("Missing nonce or signature in headers")
            return jsonify({'error': 'Missing nonce or signature'}), 400
            
        # Load and verify contract
        contract = load_contract()
        if not contract:
            logger.error("Contract not loaded")
            return jsonify({'error': 'Contract not loaded'}), 500
            
        # Use the endpoint directly as client_name
        client_name = endpoint
        logger.info(f"Using client name: {client_name}")
        
        # Verify signature using smart contract
        try:
            # Convert signature to bytes
            sig_bytes = bytes.fromhex(signature[2:] if signature.startswith('0x') else signature)
            
            logger.info("Calling contract.validateAccess with params:")
            logger.info(f"Nonce: {nonce}")
            logger.info(f"Signature: {sig_bytes.hex()}")
            logger.info(f"Endpoint: /mercedes/telemetry/{endpoint}")
            
            result = contract.functions.validateAccess(
                nonce,
                sig_bytes,
                f'/mercedes/telemetry/{endpoint}'
            ).call()
            
            if not result:
                logger.error("Contract validation failed")
                return jsonify({'error': 'Access denied by smart contract'}), 403
                
            logger.info("Contract validation successful")
            
        except Exception as e:
            logger.error(f"Contract verification failed: {str(e)}")
            return jsonify({'error': 'Contract verification failed'}), 500
            
        # Get data from database instead of dictionary
        data = get_telemetry_from_db(client_name)
        if data:
            logger.info(f"Returning data for {client_name}")
            return jsonify(data)
        else:
            logger.error(f"No data found for {client_name}")
            return jsonify({'error': 'No data available for this client'}), 404
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/mercedes/files/<client_id>/<filename>', methods=['GET'])
def get_file(client_id, filename):
    """Serve files with blockchain verification"""
    try:
        # Get request headers
        nonce = request.headers.get('X-Nonce')
        signature = request.headers.get('X-Signature')
        version = request.headers.get('X-Version', '1')  # Default to version 1
        
        # Verify client has access
        endpoint = f'/mercedes/files/{client_id}/{filename}'
        contract = load_contract()
        
        if not contract:
            return jsonify({'error': 'Contract not loaded'}), 500
            
        try:
            result = contract.functions.validateAccess(
                nonce,
                bytes.fromhex(signature[2:] if signature.startswith('0x') else signature),
                endpoint
            ).call()
            
            if not result:
                return jsonify({'error': 'Access denied'}), 403
                
        except Exception as e:
            logger.error(f"Contract verification failed: {str(e)}")
            return jsonify({'error': 'Contract verification failed'}), 500
            
        # Get file path
        file_path = os.path.join('client_files', client_id, filename)
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
            
        # Calculate file hash
        file_hash = calculate_file_hash(file_path)
        
        # Verify file hash on blockchain
        try:
            is_valid = contract.functions.verifyFileHash(
                Web3.to_checksum_address(request.headers.get('X-Client-Address')),
                filename,
                Web3.to_bytes(hexstr=file_hash),
                int(version)
            ).call()
            
            if not is_valid:
                return jsonify({'error': 'File verification failed'}), 400
                
        except Exception as e:
            logger.error(f"File verification failed: {str(e)}")
            return jsonify({'error': 'File verification failed'}), 500
            
        # If everything is valid, serve the file
        response = send_file(
            file_path,
            as_attachment=True,
            download_name=filename
        )
        
        # Add hash to response headers for client verification
        response.headers['X-File-Hash'] = file_hash
        response.headers['X-File-Version'] = version
        
        return response
        
    except Exception as e:
        logger.error(f"Error serving file: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Initialize database and start background thread
init_db()
update_thread = threading.Thread(target=update_telemetry_data, daemon=True)
update_thread.start()

if __name__ == '__main__':
    # Verify contract is deployed before starting server
    if not contract:
        logger.error("Cannot start server - contract not loaded!")
        exit(1)
    logger.info("Starting server with contract verification enabled")
    app.run(host='0.0.0.0', port=5002)