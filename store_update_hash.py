from web3 import Web3
import json
import hashlib
import os

def calculate_file_hash(file_path):
    """Calculate SHA3 hash of a file"""
    sha3_hash = hashlib.sha3_256()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            sha3_hash.update(chunk)
    return '0x' + sha3_hash.hexdigest()

def main():
    # Connect to local Geth node
    w3 = Web3(Web3.HTTPProvider('http://localhost:8545'))
    
    # Load contract
    with open('contract.json', 'r') as f:
        contract_data = json.load(f)
    
    contract = w3.eth.contract(
        address=contract_data['address'],
        abi=contract_data['abi']
    )
    
    # Load accounts
    with open('accounts.json', 'r') as f:
        accounts = json.load(f)
    
    # Create client_files directory if it doesn't exist
    os.makedirs('client_files/client1', exist_ok=True)
    
    # Create a dummy update file
    update_file = 'client_files/client1/client1_latest_update'
    with open(update_file, 'w') as f:
        f.write("This is a test update file for client1\nVersion: 1.0.0\n")
    
    # Calculate file hash
    file_hash = calculate_file_hash(update_file)
    print(f"\nCalculated file hash: {file_hash}")
    
    # Store hash on blockchain
    try:
        tx_hash = contract.functions.storeFileHash(
            Web3.to_checksum_address(accounts['client1']['address']),
            'client1_latest_update',
            Web3.to_bytes(hexstr=file_hash),
            1  # version 1
        ).transact({
            'from': w3.eth.accounts[0]  # admin account
        })
        
        # Wait for transaction
        w3.eth.wait_for_transaction_receipt(tx_hash)
        print("\nFile hash stored on blockchain successfully!")
        print(f"Transaction hash: {tx_hash.hex()}")
        
    except Exception as e:
        print(f"\nError storing hash: {str(e)}")

if __name__ == "__main__":
    main()
