from flask import Flask, request, jsonify, session
from flask_cors import CORS
from combined_client import CombinedClient
import json
from web3 import Web3
import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from eth_account.messages import encode_defunct
import uuid
import traceback
import random
import string
import requests
# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'your-flask-secret-key-here')

# Enable CORS for React frontend
CORS(app, origins=["http://localhost:3000", "http://localhost:5173"], supports_credentials=True)

# In-memory storage for session data (use Redis/database in production)
sessions = {}

def generate_auth_code():
    """Generate a random authorization code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

def get_session_data(session_id):
    """Get session data by session ID"""
    return sessions.get(session_id, {})

def update_session_data(session_id, data):
    """Update session data"""
    if session_id not in sessions:
        sessions[session_id] = {}
    sessions[session_id].update(data)

def create_client_instance(config):
    """Create a new CombinedClient instance from config"""
    return CombinedClient(
        client_id=config.get('client_id'),
        client_secret=config.get('client_secret'),
        auth_server_url=config.get('auth_server'),
        resource_server_url=config.get('resource_server')
    )

def verify_token(token):
    """Verify the JWT token"""
    try:
        # Use the same secret key as the auth server and resource server
        secret_key = os.getenv('SECRET_KEY', 'your-secret-key')
        
        # Extract token from Bearer format if present
        if token.startswith('Bearer '):
            token = token.split(' ')[1]
        
        # Try different algorithms
        algorithms = ['HS256', 'RS256']
        for algorithm in algorithms:
            try:
                payload = jwt.decode(token, secret_key, algorithms=[algorithm])
                
                # Verify required claims
                if not all(k in payload for k in ['client_id', 'vin', 'scope']):
                    return False, "Token missing required claims"
                    
                return True, payload
            except jwt.InvalidAlgorithmError:
                continue
            except Exception as e:
                continue
                
        return False, "Could not verify token with any supported algorithm"
        
    except jwt.ExpiredSignatureError:
        return False, "Token has expired"
    except jwt.InvalidTokenError as e:
        return False, f"Invalid token: {str(e)}"

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

@app.route('/api/session/create', methods=['POST'])
def create_session():
    """Create a new session"""
    try:
        session_id = str(uuid.uuid4())
        sessions[session_id] = {
            'step': 1,
            'created_at': datetime.now().isoformat(),
            'last_activity': datetime.now().isoformat()
        }
        
        app.logger.info(f"Created new session: {session_id}")
        
        return jsonify({
            "success": True,
            "session_id": session_id,
            "step": 1,
            "message": "Session created successfully"
        })
    except Exception as e:
        app.logger.error(f"Error creating session: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/session/<session_id>', methods=['GET'])
def get_session(session_id):
    """Get session status"""
    try:
        session_data = get_session_data(session_id)
        if not session_data:
            return jsonify({
                "success": False,
                "error": "Session not found"
            }), 404
        
        # Update last activity
        update_session_data(session_id, {
            'last_activity': datetime.now().isoformat()
        })
        
        return jsonify({
            "success": True,
            "session_data": session_data
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500



@app.route('/api/auth/configure', methods=['POST'])
def configure_client():
    """Configure OAuth client and request authorization code from auth server"""
    try:
        data = request.json
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({
                "success": False,
                "error": "Session ID required"
            }), 400
        
        # Check if session exists
        session_data = get_session_data(session_id)
        if not session_data:
            return jsonify({
                "success": False,
                "error": "Session not found"
            }), 404
        
        # Extract configuration
        client_id = data.get('client_id', 'tesla_models_3')
        client_secret = data.get('client_secret', 'tesla_secret_3')
        auth_server = data.get('auth_server', 'http://localhost:5001')
        resource_server = data.get('resource_server', 'http://localhost:5002')
        mode = data.get('mode', '1')  # "1" for telemetry, "2" for file download
        scopes = data.get('scopes', ['engine_start', 'door_unlock'])
        
        # Handle scopes based on mode
        if mode == "2":  # File download mode
            scopes = ["file_download"]
        
        # Create scope string
        scope_string = " ".join(scopes)
        
        # Request authorization code from auth server
        try:
            auth_url = f"{auth_server}/authorize"
            auth_payload = {
                'client_id': client_id,
                'client_secret': client_secret,
                'scope': scope_string
            }
            
            app.logger.info(f"Requesting auth code from {auth_url} with payload: {auth_payload}")
            
            response = requests.post(auth_url, json=auth_payload, timeout=10)
            
            if response.status_code == 200:
                auth_response = response.json()
                auth_code = auth_response.get('code')
                
                if not auth_code:
                    return jsonify({
                        "success": False,
                        "error": "No authorization code received from auth server"
                    }), 400
                
                app.logger.info(f"Session {session_id} received auth code from server: {auth_code}")
                
            else:
                app.logger.error(f"Auth server returned status {response.status_code}: {response.text}")
                return jsonify({
                    "success": False,
                    "error": f"Auth server error: {response.text}"
                }), response.status_code
                
        except requests.RequestException as e:
            app.logger.error(f"Failed to connect to auth server: {str(e)}")
            return jsonify({
                "success": False,
                "error": f"Could not connect to auth server: {str(e)}"
            }), 500
        
        # Store configuration and auth code in session
        config_data = {
            'client_id': client_id,
            'client_secret': client_secret,
            'auth_server': auth_server,
            'resource_server': resource_server,
            'mode': mode,
            'scopes': scopes,
            'scope_string': scope_string
        }
        
        update_session_data(session_id, {
            'client_config': config_data,
            'generated_auth_code': auth_code,
            'step': 1.5,
            'last_activity': datetime.now().isoformat()
        })
        
        app.logger.info(f"Session {session_id} configured with auth code from server: {auth_code}")
        
        return jsonify({
            "success": True,
            "auth_code": auth_code,
            "step": 1.5,
            "config": {
                "mode": mode,
                "scopes": scopes,
                "client_id": client_id,
                "auth_server": auth_server,
                "resource_server": resource_server
            },
            "message": "Client configured and authorization code received"
        })
            
    except Exception as e:
        app.logger.error(f"Error configuring client: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500
@app.route('/api/auth/validate-code', methods=['POST'])
def validate_auth_code():
    """Validate authorization code"""
    try:
        data = request.json
        session_id = data.get('session_id')
        input_code = data.get('auth_code')
        
        if not session_id or not input_code:
            return jsonify({
                "success": False,
                "error": "Session ID and authorization code required"
            }), 400
        
        session_data = get_session_data(session_id)
        if not session_data:
            return jsonify({
                "success": False,
                "error": "Session not found"
            }), 404
        
        generated_code = session_data.get('generated_auth_code')
        
        if not generated_code:
            return jsonify({
                "success": False,
                "error": "No authorization code found for this session"
            }), 400
        
        if input_code.strip() == generated_code:
            update_session_data(session_id, {
                'validated_auth_code': input_code,
                'step': 2,
                'last_activity': datetime.now().isoformat()
            })
            
            app.logger.info(f"Session {session_id} auth code validated successfully")
            
            return jsonify({
                "success": True,
                "step": 2,
                "message": "Authorization code validated successfully"
            })
        else:
            app.logger.warning(f"Session {session_id} invalid auth code attempt: {input_code}")
            return jsonify({
                "success": False,
                "error": "Invalid authorization code"
            }), 400
            
    except Exception as e:
        app.logger.error(f"Error validating auth code: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/token/generate', methods=['POST'])
def generate_token():
    """Generate access token"""
    try:
        data = request.json
        session_id = data.get('session_id')
        
        app.logger.info(f"Token generation request for session: {session_id}")
        
        if not session_id:
            return jsonify({
                "success": False,
                "error": "Session ID required"
            }), 400
        
        session_data = get_session_data(session_id)
        if not session_data:
            app.logger.error(f"Session {session_id} not found")
            return jsonify({
                "success": False,
                "error": "Session not found"
            }), 404
        
        # Check if auth code was validated
        validated_auth_code = session_data.get('validated_auth_code')
        if not validated_auth_code:
            app.logger.error(f"Session {session_id} - Authorization code not validated")
            app.logger.debug(f"Session data: {session_data}")
            return jsonify({
                "success": False,
                "error": "Authorization code not validated"
            }), 400
        
        # Create client instance
        config = session_data.get('client_config', {})
        app.logger.info(f"Session {session_id} - Client config: {config}")
        
        client = create_client_instance(config)
        
        app.logger.info(f"Session {session_id} - Using auth code: {validated_auth_code}")
        app.logger.info(f"Session {session_id} - Auth server URL: {config.get('auth_server')}")
        
        # Add debugging to the token exchange
        try:
            token = client.get_token(validated_auth_code)
            app.logger.info(f"Session {session_id} - Token exchange successful: {bool(token)}")
            
            if token:
                # Don't log the full token for security, just confirmation
                app.logger.info(f"Session {session_id} - Token generated successfully")
                
                update_session_data(session_id, {
                    'generated_token': token,
                    'step': 2.5,
                    'last_activity': datetime.now().isoformat()
                })
                
                return jsonify({
                    "success": True,
                    "token": token,
                    "step": 2.5,
                    "message": "Access token generated successfully"
                })
            else:
                app.logger.error(f"Session {session_id} - Token exchange returned None")
                return jsonify({
                    "success": False,
                    "error": "Token generation failed - no token received"
                }), 400
                
        except Exception as token_error:
            app.logger.error(f"Session {session_id} - Token exchange error: {str(token_error)}")
            app.logger.error(f"Session {session_id} - Token exchange traceback: {traceback.format_exc()}")
            return jsonify({
                "success": False,
                "error": f"Token exchange failed: {str(token_error)}"
            }), 400
            
    except Exception as e:
        app.logger.error(f"Error generating token: {str(e)}")
        app.logger.error(f"Full traceback: {traceback.format_exc()}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Also add a debug endpoint to check the CombinedClient's get_token method
@app.route('/api/debug/token-request', methods=['POST'])
def debug_token_request():
    """Debug token request details"""
    try:
        data = request.json
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({"error": "Session ID required"}), 400
        
        session_data = get_session_data(session_id)
        if not session_data:
            return jsonify({"error": "Session not found"}), 404
        
        config = session_data.get('client_config', {})
        validated_auth_code = session_data.get('validated_auth_code')
        
        # Create the token request payload that would be sent
        token_request_data = {
            'grant_type': 'authorization_code',
            'code': validated_auth_code,
            'client_id': config.get('client_id'),
            'client_secret': config.get('client_secret'),
            'redirect_uri': 'http://localhost:3000/callback'  # This might be the issue
        }
        
        return jsonify({
            "success": True,
            "token_request_data": token_request_data,
            "auth_server_url": config.get('auth_server'),
            "session_step": session_data.get('step'),
            "has_validated_code": bool(validated_auth_code)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route('/api/token/validate', methods=['POST'])
def validate_token():
    """Validate token with resource server"""
    try:
        data = request.json
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({
                "success": False,
                "error": "Session ID required"
            }), 400
        
        session_data = get_session_data(session_id)
        if not session_data:
            return jsonify({
                "success": False,
                "error": "Session not found"
            }), 404
        
        token = session_data.get('generated_token')
        if not token:
            return jsonify({
                "success": False,
                "error": "No token found"
            }), 400
        
        # Ensure token is in correct format
        if not token.startswith('Bearer '):
            token = f'Bearer {token}'
        
        # Verify token
        is_valid, message = verify_token(token)
        
        if is_valid:
            update_session_data(session_id, {
                'validated_token': token,
                'token_validated': True,
                'step': 2.75,
                'last_activity': datetime.now().isoformat()
            })
            
            app.logger.info(f"Session {session_id} token validated successfully")
            
            return jsonify({
                "success": True,
                "message": "Token validated successfully",
                "step": 2.75,
                "token_details": message if isinstance(message, dict) else None
            })
        else:
            return jsonify({
                "success": False,
                "error": f"Token validation failed: {message}"
            }), 400
            
    except Exception as e:
        app.logger.error(f"Error validating token: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/nonce/request', methods=['POST'])
def request_nonce():
    """Request nonce from blockchain"""
    try:
        data = request.json
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({
                "success": False,
                "error": "Session ID required"
            }), 400
        
        session_data = get_session_data(session_id)
        if not session_data:
            return jsonify({
                "success": False,
                "error": "Session not found"
            }), 404
        
        # Create client instance
        config = session_data.get('client_config', {})
        client = create_client_instance(config)
        
        # Get nonce
        nonce = client.w3.eth.get_transaction_count(client.address)
        
        update_session_data(session_id, {
            'nonce': nonce,
            'blockchain_address': client.address,
            'step': 2.8,
            'last_activity': datetime.now().isoformat()
        })
        
        app.logger.info(f"Session {session_id} nonce requested: {nonce}")
        
        return jsonify({
            "success": True,
            "nonce": nonce,
            "address": client.address,
            "step": 2.8,
            "message": "Nonce retrieved successfully"
        })
        
    except Exception as e:
        app.logger.error(f"Error requesting nonce: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/nonce/sign', methods=['POST'])
def sign_nonce():
    """Sign the nonce"""
    try:
        data = request.json
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({
                "success": False,
                "error": "Session ID required"
            }), 400
        
        session_data = get_session_data(session_id)
        if not session_data:
            return jsonify({
                "success": False,
                "error": "Session not found"
            }), 404
        
        nonce = session_data.get('nonce')
        if nonce is None:
            return jsonify({
                "success": False,
                "error": "No nonce found"
            }), 400
        
        # Create client instance
        config = session_data.get('client_config', {})
        client = create_client_instance(config)
        
        # Create message to sign
        message = f"Nonce: {str(nonce)}"
        message_bytes = message.encode('utf-8')
        
        # Sign the message
        signed_message = client.w3.eth.account.sign_message(
            encode_defunct(message_bytes),
            private_key=client.private_key
        )
        
        signature = signed_message.signature.hex()
        
        # Verify signature
        recovered_address = client.w3.eth.account.recover_message(
            encode_defunct(message_bytes),
            signature=bytes.fromhex(signature)
        )
        
        signature_valid = recovered_address.lower() == client.address.lower()
        
        if signature_valid:
            update_session_data(session_id, {
                'signature': signature,
                'signed_message': message,
                'step': 3,
                'last_activity': datetime.now().isoformat()
            })
            
            app.logger.info(f"Session {session_id} nonce signed successfully")
            
            return jsonify({
                "success": True,
                "signature": signature,
                "message": message,
                "verified": True,
                "step": 3,
                "message_text": "Nonce signed successfully"
            })
        else:
            return jsonify({
                "success": False,
                "error": "Signature verification failed"
            }), 400
            
    except Exception as e:
        app.logger.error(f"Error signing nonce: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/resource/telemetry', methods=['POST'])
def get_telemetry():
    """Get telemetry data"""
    try:
        data = request.json
        session_id = data.get('session_id')
        scope = data.get('scope', 'engine_start')
        
        if not session_id:
            return jsonify({
                "success": False,
                "error": "Session ID required"
            }), 400
        
        session_data = get_session_data(session_id)
        if not session_data:
            return jsonify({
                "success": False,
                "error": "Session not found"
            }), 404
        
        # Create client instance
        config = session_data.get('client_config', {})
        client = create_client_instance(config)
        
        # Set token
        token = session_data.get('validated_token')
        if not token:
            return jsonify({
                "success": False,
                "error": "No validated token found"
            }), 400
        
        client.token = token
        
        # Get data
        response = client.get_data(scope)
        
        if response:
            # Try to parse JSON if response is string
            try:
                if isinstance(response, str):
                    data = json.loads(response)
                else:
                    data = response
            except json.JSONDecodeError:
                data = {"raw_response": response}
            
            update_session_data(session_id, {
                'last_data': data,
                'step': 4,
                'last_activity': datetime.now().isoformat()
            })
            
            app.logger.info(f"Session {session_id} telemetry data retrieved")
            
            return jsonify({
                "success": True,
                "data": data,
                "step": 4,
                "message": "Telemetry data retrieved successfully"
            })
        else:
            return jsonify({
                "success": False,
                "error": "No data received from server"
            }), 400
            
    except Exception as e:
        app.logger.error(f"Error getting telemetry: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/resource/download', methods=['POST'])
def download_file():
    """Download file"""
    try:
        data = request.json
        session_id = data.get('session_id')
        filename = data.get('filename', 'latest_update')
        version = data.get('version', '1')
        
        if not session_id:
            return jsonify({
                "success": False,
                "error": "Session ID required"
            }), 400
        
        session_data = get_session_data(session_id)
        if not session_data:
            return jsonify({
                "success": False,
                "error": "Session not found"
            }), 404
        
        # Create client instance
        config = session_data.get('client_config', {})
        client = create_client_instance(config)
        
        # Set token
        token = session_data.get('validated_token')
        if not token:
            return jsonify({
                "success": False,
                "error": "No validated token found"
            }), 400
        
        client.token = token
        
        # Create downloads directory if it doesn't exist
        os.makedirs('downloads', exist_ok=True)
        
        # Download file
        save_path = f"downloads/{client.client_id}_{filename}.txt"
        success = client.download_file(
            filename=filename,
            version=version,
            save_path=save_path
        )
        
        if success:
            update_session_data(session_id, {
                'downloaded_file': save_path,
                'step': 4,
                'last_activity': datetime.now().isoformat()
            })
            
            app.logger.info(f"Session {session_id} file downloaded: {save_path}")
            
            return jsonify({
                "success": True,
                "file_path": save_path,
                "step": 4,
                "message": "File downloaded successfully"
            })
        else:
            return jsonify({
                "success": False,
                "error": "Download failed"
            }), 400
            
    except Exception as e:
        app.logger.error(f"Error downloading file: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/session/<session_id>/reset', methods=['POST'])
def reset_session(session_id):  # Add session_id parameter
    """Reset session to start over"""
    try:
        if session_id in sessions:
            sessions[session_id] = {
                'step': 1,
                'created_at': datetime.now().isoformat(),
                'last_activity': datetime.now().isoformat()
            }
            
            app.logger.info(f"Session {session_id} reset")
        
        return jsonify({
            "success": True,
            "step": 1,
            "message": "Session reset successfully"
        })
        
    except Exception as e:
        app.logger.error(f"Error resetting session: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/sessions/cleanup', methods=['POST'])
def cleanup_sessions():
    """Clean up old sessions (call this periodically)"""
    try:
        current_time = datetime.now()
        expired_sessions = []
        
        for session_id, session_data in sessions.items():
            created_at = datetime.fromisoformat(session_data.get('created_at', current_time.isoformat()))
            if (current_time - created_at).total_seconds() > 3600:  # 1 hour
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            del sessions[session_id]
            app.logger.info(f"Cleaned up expired session: {session_id}")
        
        return jsonify({
            "success": True,
            "cleaned_sessions": len(expired_sessions),
            "message": f"Cleaned up {len(expired_sessions)} expired sessions"
        })
        
    except Exception as e:
        app.logger.error(f"Error cleaning up sessions: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/sessions/list', methods=['GET'])
def list_sessions():
    """List all active sessions (for debugging)"""
    try:
        session_list = []
        for session_id, session_data in sessions.items():
            session_list.append({
                'session_id': session_id,
                'step': session_data.get('step', 1),
                'created_at': session_data.get('created_at'),
                'last_activity': session_data.get('last_activity')
            })
        
        return jsonify({
            "success": True,
            "sessions": session_list,
            "total_sessions": len(session_list)
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)