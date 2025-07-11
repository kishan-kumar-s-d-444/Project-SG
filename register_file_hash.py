from web3 import Web3
import json
import os
from hashlib import sha3_256

def calculate_file_hash(file_path):
    """Calculate SHA3 hash of a file"""
    sha3_hash = sha3_256()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            sha3_hash.update(chunk)
    return '0x' + sha3_hash.hexdigest()

def main():
    # Connect to local Geth node
    w3 = Web3(Web3.HTTPProvider('http://localhost:8545'))
    
    # Load contract data
    with open('contract.json', 'r') as f:
        contract_data = json.load(f)
    
    # Create contract instance
    contract = w3.eth.contract(
        address=contract_data['address'],
        abi=contract_data['abi']
    )
    
    # Get deployer account
    deployer = w3.eth.accounts[0]
    
    # Load client addresses
    with open('accounts.json', 'r') as f:
        accounts = json.load(f)
    
    # Register file hashes for all Tesla clients
    for client_name in accounts:
        if not client_name.startswith('tesla_'):
            continue
            
        file_name = f'{client_name}_latest_update'
        file_path = os.path.join('client_files', client_name, file_name)
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Create update file with Tesla-specific content
        if not os.path.exists(file_path):
            model = client_name.split('_')[1].upper()  # Extract model from client_name
            with open(file_path, 'w') as f:
                f.write(f"""Tesla {model} Software Update
Version: 1
Date: 2025-01-23

Changes:
- Enhanced Autopilot features
- Improved battery management system
- Updated entertainment system
- New security patches
- Optimized charging algorithms
- Enhanced climate control system

Vehicle-specific updates for {client_name}:
- Custom performance tuning
- Battery optimization for your region
- Personalized user interface improvements
""")
        
        # Calculate file hash
        file_hash = calculate_file_hash(file_path)
        client_address = accounts[client_name]['address']
        
        print(f"\nRegistering hash {file_hash} for {client_name}'s update file...")
        
        # Store the file hash in the contract
        try:
            tx_hash = contract.functions.storeFileHash(
                Web3.to_checksum_address(client_address),
                file_name,
                Web3.to_bytes(hexstr=file_hash),
                1  # version 1
            ).transact({'from': deployer})
            
            # Wait for transaction to be mined
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            
            if receipt.status == 1:
                print(f"✅ Successfully registered file hash for {client_name}!")
            else:
                print(f"❌ Failed to register file hash for {client_name}!")
                
        except Exception as e:
            print(f"Error registering hash for {client_name}: {str(e)}")

if __name__ == '__main__':
    main()
