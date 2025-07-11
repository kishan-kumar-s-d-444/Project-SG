import requests
from web3 import Web3
import json
from eth_account.messages import encode_defunct

# Connect to blockchain
w3 = Web3(Web3.HTTPProvider('http://localhost:8545'))

# Load accounts
with open('accounts.json', 'r') as f:
    accounts = json.load(f)

# Load contract
with open('contract.json', 'r') as f:
    contract_data = json.load(f)

contract = w3.eth.contract(
    address=contract_data['address'],
    abi=contract_data['abi']
)

class TelemetryClient:
    def __init__(self, client_name):
        self.client_name = client_name
        self.address = accounts[client_name]['address']
        self.private_key = accounts[client_name]['private_key']
        self.endpoint = f'/mercedes/telemetry/{client_name}_data'
        
    def get_telemetry(self):
        try:
            # Step 1: Get nonce from resource server
            print(f"\n{self.client_name}: Getting nonce from resource server...")
            response = requests.get('http://localhost:5000/get-nonce')
            nonce = response.json()['nonce']
            print(f"Received nonce: {nonce}")
            
            # Step 2: Sign the nonce
            print("\nSigning nonce...")
            message_hash = w3.solidity_keccak(['string'], [nonce])
            eth_message = encode_defunct(primitive=message_hash)
            signed_message = w3.eth.account.sign_message(eth_message, private_key=self.private_key)
            signature = signed_message.signature.hex()
            
            # Step 3: Request telemetry data with signed nonce
            print(f"\nRequesting telemetry data from endpoint: {self.endpoint}")
            headers = {
                'X-Nonce': nonce,
                'X-Signature': signature
            }
            
            response = requests.get(
                f'http://localhost:5000{self.endpoint}',
                headers=headers
            )
            
            if response.status_code == 200:
                print("\nSuccessfully retrieved telemetry data:")
                print(json.dumps(response.json(), indent=2))
                return response.json()
            else:
                print(f"\nError: {response.json()['error']}")
                return None
                
        except Exception as e:
            print(f"Error: {str(e)}")
            return None

def test_all_clients():
    """Test all clients accessing their respective endpoints"""
    clients = ['client1', 'client2', 'client3', 'client4']
    
    for client_name in clients:
        print(f"\n{'='*50}")
        print(f"Testing {client_name}")
        print('='*50)
        
        client = TelemetryClient(client_name)
        client.get_telemetry()
        
        # Try to access another client's endpoint
        other_client = clients[(clients.index(client_name) + 1) % len(clients)]
        print(f"\nTrying to access {other_client}'s endpoint (should fail):")
        client.endpoint = f'/mercedes/telemetry/{other_client}_data'
        client.get_telemetry()

if __name__ == "__main__":
    test_all_clients()