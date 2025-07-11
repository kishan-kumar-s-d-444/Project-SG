from web3 import Web3
import json
from eth_account import Account
import secrets

def generate_tesla_accounts():
    # Connect to local Ethereum node
    w3 = Web3(Web3.HTTPProvider('http://localhost:8545'))
    
    # Check connection
    if not w3.is_connected():
        raise Exception("Failed to connect to Ethereum node")
    
    # Tesla model configurations
    tesla_configs = [
        ("Model S", 2023), ("Model S", 2024), ("Model S", 2025), ("Model S", 2025), ("Model S", 2024),
        ("Model 3", 2023), ("Model 3", 2024), ("Model 3", 2025), ("Model 3", 2025), ("Model 3", 2024),
        ("Model X", 2023), ("Model X", 2024), ("Model X", 2025), ("Model X", 2025), ("Model X", 2024),
        ("Model Y", 2023), ("Model Y", 2024), ("Model Y", 2025), ("Model Y", 2025), ("Model Y", 2024)
    ]
    
    # Load existing accounts if any
    try:
        with open('accounts.json', 'r') as f:
            accounts = json.load(f)
    except FileNotFoundError:
        accounts = {}
    
    # Generate accounts for each Tesla configuration
    for idx, (model, year) in enumerate(tesla_configs, 1):
        client_id = f'tesla_{model.lower().replace(" ", "")}_{idx}'
        
        # Skip if account already exists
        if client_id in accounts:
            print(f"Account already exists for {client_id}")
            continue
        
        # Generate new account
        private_key = secrets.token_hex(32)
        account = Account.from_key(private_key)
        
        accounts[client_id] = {
            "address": account.address,
            "private_key": private_key
        }
        print(f"Generated account for {client_id}")
    
    # Save updated accounts to JSON file
    with open('accounts.json', 'w') as f:
        json.dump(accounts, f, indent=4)
    
    print("\nAll accounts saved to accounts.json")
    return accounts

if __name__ == "__main__":
    try:
        accounts = generate_tesla_accounts()
        print("\nGenerated/Updated accounts:")
        for client, details in accounts.items():
            if client.startswith('tesla_'):  # Only show newly added Tesla accounts
                print(f"\n{client}:")
                print(f"Address: {details['address']}")
                print(f"Private Key: {details['private_key']}")
    except Exception as e:
        print(f"Error: {e}") 