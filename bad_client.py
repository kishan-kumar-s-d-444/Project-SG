import requests
import json
import sys
from web3 import Web3
from eth_account.messages import encode_defunct
from datetime import datetime

class BadClient:
    def __init__(self, client_id, client_secret, auth_server_url, resource_server_url):
        self.client_id = client_id
        self.client_secret = client_secret
        self.auth_server_url = auth_server_url.rstrip('/')
        self.resource_server_url = resource_server_url.rstrip('/')
        self.token = None
        
        # Initialize Web3 and use a fake private key
        self.w3 = Web3(Web3.HTTPProvider('http://localhost:8545'))
        self.private_key = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'  # Invalid key
        self.address = '0x1234567890123456789012345678901234567890'  # Invalid address

    def authorize(self, scope):
        """First step: Get authorization code - same as good client"""
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
        """Second step: Exchange auth code for token - same as good client"""
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
        """Sign nonce with invalid private key"""
        try:
            print("\nAttempting to sign with invalid key...")
            message_hash = self.w3.solidity_keccak(['string'], [nonce])
            eth_message = encode_defunct(primitive=message_hash)
            signed_message = self.w3.eth.account.sign_message(
                eth_message,
                private_key=self.private_key
            )
            signature = signed_message.signature.hex()
            print(f"Generated invalid signature: {signature}")
            return signature
        except Exception as e:
            print(f"Error signing nonce (expected with invalid key): {str(e)}")
            return None

    def get_data(self, endpoint):
        """Try to get data with invalid signature"""
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
            
            # Step 2: Try to sign with invalid key
            signature = self.sign_nonce(nonce)
            if not signature:
                print("Failed to sign nonce (expected with invalid key)")
                return None
            
            # Step 3: Send request with invalid signature
            headers = {
                'X-Nonce': nonce,
                'X-Signature': signature,
                'Content-Type': 'application/json'
            }
            
            telemetry_endpoint = f"client1_data"
            url = f"{self.resource_server_url}/mercedes/telemetry/{telemetry_endpoint}"
            print(f"\nAttempting request with invalid signature to: {url}")
            print(f"Headers: {headers}")
            
            response = requests.get(url, headers=headers)
            
            print(f"Response Status: {response.status_code}")
            print(f"Response: {response.text}")
            
            return response.json() if response.status_code == 200 else None
            
        except Exception as e:
            print(f"Error in request (expected): {str(e)}")
            return None

def main():
    print("🚫 Starting Bad Client Test")
    print("⚠️ This client uses an invalid private key")
    print(f"⏰ Test started at: {datetime.now()}\n")

    # Initialize bad client
    client = BadClient(
        client_id="test_car_1",
        client_secret="test_secret_1",
        auth_server_url="http://localhost:5001",
        resource_server_url="http://localhost:5002"
    )
    print("❌ Bad client initialized\n")

    # Try to get data
    print("Attempting to get data with invalid signature...")
    data = client.get_data("engine_start")
    
    if data:
        print("⚠️ WARNING: Got data despite invalid signature!")
        print(json.dumps(data, indent=2))
    else:
        print("✅ Security working: Access denied with invalid signature")

if __name__ == "__main__":
    main()
