import requests
import json
import sys
import os
import hashlib
from web3 import Web3
from eth_account.messages import encode_defunct
from datetime import datetime

class CombinedClient:
    def __init__(self, client_id, client_secret, auth_server_url, resource_server_url):
        self.client_id = client_id
        self.client_secret = client_secret
        self.auth_server_url = auth_server_url.rstrip('/')
        self.resource_server_url = resource_server_url.rstrip('/')
        self.token = None
        
        # Initialize Web3 and load account
        self.w3 = Web3(Web3.HTTPProvider('http://localhost:8545'))
        with open('accounts.json', 'r') as f:
            accounts = json.load(f)
            self.private_key = accounts[self.client_id]['private_key']
            self.address = accounts[self.client_id]['address']

    def authorize(self, scope):
        """First step: Get authorization code"""
        try:
            print(f"\nRequesting authorization from {self.auth_server_url}/authorize")
            response = requests.post(
                f"{self.auth_server_url}/authorize",
                json={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "scope": scope
                },
                headers={"Content-Type": "application/json"}
            )
            
            print(f"Auth Response Status: {response.status_code}")
            print(f"Auth Response: {response.text}")
            
            if response.status_code == 200:
                return response.json()["code"]
            return None
            
        except Exception as e:
            print(f"Authorization error: {str(e)}")
            return None

    def get_token(self, auth_code):
        """Second step: Exchange auth code for token"""
        try:
            print(f"\nExchanging auth code for token at {self.auth_server_url}/token")
            response = requests.post(
                f"{self.auth_server_url}/token",
                data={
                    "code": auth_code,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "grant_type": "authorization_code"
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            print(f"Token Response Status: {response.status_code}")
            
            if response.status_code == 200:
                token_data = response.json()
                self.token = token_data["access_token"]
                return self.token
            return None
            
        except Exception as e:
            print(f"Token exchange error: {str(e)}")
            return None

    def sign_nonce(self, nonce):
        """Sign nonce with private key using solidity keccak hash"""
        try:
            print("\nSigning nonce...")
            message_hash = self.w3.solidity_keccak(['string'], [nonce])
            eth_message = encode_defunct(primitive=message_hash)
            signed_message = self.w3.eth.account.sign_message(
                eth_message,
                private_key=self.private_key
            )
            signature = signed_message.signature.hex()
            print(f"Generated signature: {signature}")
            return signature
        except Exception as e:
            print(f"Error signing nonce: {str(e)}")
            return None

    def get_data(self, endpoint):
        """Complete flow to get data from resource server"""
        try:
            # Step 1: Get nonce
            print("\nGetting nonce...")
            nonce_response = requests.get(
                f"{self.resource_server_url}/get-nonce"
            )
            
            if nonce_response.status_code != 200:
                print(f"Failed to get nonce: {nonce_response.text}")
                return None
                
            nonce = nonce_response.json()["nonce"]
            print(f"Received nonce: {nonce}")
            
            # Step 2: Sign nonce using solidity keccak
            signature = self.sign_nonce(nonce)
            if not signature:
                print("Failed to sign nonce")
                return None
            
            # Step 3: Send request with signed nonce
            headers = {
                'X-Nonce': nonce,
                'X-Signature': signature,
                'Content-Type': 'application/json'
            }
            
            # Use client_id directly as the endpoint
            url = f"{self.resource_server_url}/mercedes/telemetry/{self.client_id}"
            print(f"\nSending request to: {url}")
            print(f"Headers: {headers}")
            
            response = requests.get(url, headers=headers)
            
            print(f"Response Status: {response.status_code}")
            if response.status_code != 200:
                print(f"Error response: {response.text}")
                return None
            
            return response.json()
            
        except Exception as e:
            print(f"Error getting data: {str(e)}")
            return None

    def download_file(self, filename, version='1', save_path=None):
        """Download and verify file from resource server"""
        try:
            # Step 1: Get nonce
            print("\nGetting nonce for file download...")
            nonce_response = requests.get(
                f"{self.resource_server_url}/get-nonce"
            )
            
            if nonce_response.status_code != 200:
                print(f"Failed to get nonce: {nonce_response.text}")
                return None
                
            nonce = nonce_response.json()["nonce"]
            print(f"Received nonce: {nonce}")
            
            # Step 2: Sign nonce
            signature = self.sign_nonce(nonce)
            if not signature:
                print("Failed to sign nonce")
                return None
            
            # Step 3: Request file
            headers = {
                'X-Nonce': nonce,
                'X-Signature': signature,
                'X-Version': str(version),
                'X-Client-Address': self.address
            }
            
            # Use client_id for the filename
            if filename == "latest_update":
                filename = f"{self.client_id}_latest_update"
            
            # Format endpoint for resource server
            endpoint = f'/mercedes/files/{self.client_id}/{filename}'
            url = f"{self.resource_server_url}{endpoint}"
            print(f"\nRequesting file from: {url}")
            print(f"Headers: {headers}")
            
            response = requests.get(
                url,
                headers=headers,
                stream=True
            )
            
            if response.status_code != 200:
                print(f"Error downloading file: {response.text}")
                return False
            
            # Step 4: Save and verify file
            if save_path is None:
                save_path = os.path.join('downloads', self.client_id, filename)
            
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            
            sha3_hash = hashlib.sha3_256()
            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        sha3_hash.update(chunk)
                        f.write(chunk)
            
            calculated_hash = '0x' + sha3_hash.hexdigest()
            server_hash = response.headers.get('X-File-Hash')
            
            if calculated_hash != server_hash:
                print("⚠️ Warning: File hash mismatch!")
                os.remove(save_path)
                return False
            
            print(f"✅ File downloaded and verified: {save_path}")
            print(f"📝 File hash: {calculated_hash}")
            return True
            
        except Exception as e:
            print(f"Error downloading file: {str(e)}")
            return False

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 combined_client.py <mode>")
        print("Mode 1: Get telemetry data")
        print("Mode 2: Download file")
        sys.exit(1)

    mode = sys.argv[1]
    
    print("🚗 Starting Combined Flow Test")
    print(f"⏰ Test started at: {datetime.now()}\n")

    # Initialize client
    client = CombinedClient(
        client_id="tesla_models_1",
        client_secret="tesla_secret_1",
        auth_server_url="http://localhost:5001",
        resource_server_url="http://localhost:5002"
    )
    print("✅ Client initialized\n")

    # Authorization flow remains the same for both modes
    print("Step 1: Requesting Authorization...")
    scopes = ["engine_start", "door_unlock"]
    scope_string = " ".join(scopes)
    auth_code = client.authorize(scope=scope_string)
    
    if not auth_code:
        print("❌ Authorization failed!")
        sys.exit(1)
    print(f"✅ Authorization successful! Code: {auth_code}\n")

    # Get token
    print("Step 2: Getting token...")
    token = client.get_token(auth_code)
    
    if not token:
        print("❌ Token exchange failed!")
        sys.exit(1)
    print(f"✅ Token received successfully!\n")

    # Handle different modes
    if mode == "1":
        print("Mode 1: Getting telemetry data...")
        data = client.get_data("engine_start")
        if data:
            print("✅ Data received successfully!")
            print("📡 Response Data:")
            print(json.dumps(data, indent=2))
        else:
            print("❌ Failed to get data!")
    
    elif mode == "2":
        print("Mode 2: Downloading file...")
        success = client.download_file(
            filename="latest_update",
            version="1",
            save_path=f"downloads/{client.client_id}_latest_update.txt"
        )
        if not success:
            print("❌ File download failed!")
            sys.exit(1)
    
    else:
        print(f"❌ Invalid mode: {mode}")
        print("Use 1 for telemetry data or 2 for file download")
        sys.exit(1)

if __name__ == "__main__":
    main() 