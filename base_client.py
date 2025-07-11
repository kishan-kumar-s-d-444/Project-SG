from web3 import Web3
import json
import requests
from eth_account.messages import encode_defunct
import hashlib
import os

class BaseClient:
    def __init__(self, client_name):
        # Connect to local Geth node
        self.w3 = Web3(Web3.HTTPProvider('http://localhost:8545'))
        
        # Load accounts
        with open('accounts.json', 'r') as f:
            accounts = json.load(f)
            
        self.client_name = client_name
        self.address = accounts[client_name]['address']
        self.private_key = accounts[client_name]['private_key']
        self.endpoint = f'/mercedes/telemetry/{client_name}_data'
        
        # Load contract
        with open('contract.json', 'r') as f:
            contract_data = json.load(f)
            
        self.contract = self.w3.eth.contract(
            address=contract_data['address'],
            abi=contract_data['abi']
        )
        
    def get_telemetry(self):
        """Get telemetry data from resource server with blockchain verification"""
        try:
            # Step 1: Get nonce from resource server
            print(f"\n{self.client_name}: Getting nonce from resource server...")
            response = requests.get('http://localhost:5002/get-nonce')
            if response.status_code != 200:
                print(f"Error getting nonce: {response.text}")
                return None
                
            nonce = response.json()['nonce']
            print(f"Received nonce: {nonce}")
            
            # Step 2: Sign the nonce
            print("\nSigning nonce...")
            message_hash = self.w3.solidity_keccak(['string'], [nonce])
            eth_message = encode_defunct(primitive=message_hash)
            signed_message = self.w3.eth.account.sign_message(
                eth_message,
                private_key=self.private_key
            )
            signature = signed_message.signature.hex()
            
            # Step 3: Request telemetry data with signed nonce
            print(f"\nRequesting telemetry data from endpoint: {self.endpoint}")
            headers = {
                'X-Nonce': nonce,
                'X-Signature': signature
            }
            
            response = requests.get(
                f'http://localhost:5002{self.endpoint}',
                headers=headers
            )
            
            if response.status_code == 200:
                print("\nSuccessfully retrieved telemetry data:")
                print(json.dumps(response.json(), indent=2))
                return response.json()
            else:
                print(f"\nError: {response.json().get('error', 'Unknown error')}")
                return None
                
        except Exception as e:
            print(f"Error: {str(e)}")
            return None

    def download_file(self, filename, version='1', save_path=None):
        """Download and verify file from resource server"""
        try:
            # Step 1: Get nonce
            print(f"\n{self.client_name}: Getting nonce for file download...")
            response = requests.get('http://localhost:5002/get-nonce')
            if response.status_code != 200:
                print(f"Error getting nonce: {response.text}")
                return None
                
            nonce = response.json()['nonce']
            
            # Step 2: Sign the nonce
            print("\nSigning nonce...")
            message_hash = self.w3.solidity_keccak(['string'], [nonce])
            eth_message = encode_defunct(primitive=message_hash)
            signed_message = self.w3.eth.account.sign_message(
                eth_message,
                private_key=self.private_key
            )
            signature = signed_message.signature.hex()
            
            # Step 3: Request file
            endpoint = f'/mercedes/files/{self.client_name}/{filename}'
            headers = {
                'X-Nonce': nonce,
                'X-Signature': signature,
                'X-Version': str(version),
                'X-Client-Address': self.address
            }
            
            print(f"\nRequesting file: {filename}")
            response = requests.get(
                f'http://localhost:5002{endpoint}',
                headers=headers,
                stream=True  # Stream large files
            )
            
            if response.status_code != 200:
                print(f"Error downloading file: {response.text}")
                return False
                
            # Step 4: Save file and calculate hash
            if save_path is None:
                save_path = os.path.join('downloads', self.client_name, filename)
                
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            
            sha3_hash = hashlib.sha3_256()
            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        sha3_hash.update(chunk)
                        f.write(chunk)
                        
            calculated_hash = '0x' + sha3_hash.hexdigest()
            
            # Step 5: Verify hash matches blockchain
            server_hash = response.headers.get('X-File-Hash')
            if calculated_hash != server_hash:
                print("Warning: File hash mismatch!")
                os.remove(save_path)  # Delete potentially corrupted file
                return False
                
            print(f"\nFile downloaded and verified: {save_path}")
            return True
            
        except Exception as e:
            print(f"Error downloading file: {str(e)}")
            return False
