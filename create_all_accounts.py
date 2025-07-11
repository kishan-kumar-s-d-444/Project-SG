from web3 import Web3
import json
from eth_account import Account
import secrets

def generate_eth_accounts(num_accounts=4):
    # Connect to local Ethereum node
    w3 = Web3(Web3.HTTPProvider('http://localhost:8545'))
    
    # Check connection
    if not w3.is_connected():
        raise Exception("Failed to connect to Ethereum node")
    
    # Generate accounts
    accounts = {}
    for i in range(1, num_accounts + 1):
        # Generate a random private key
        private_key = secrets.token_hex(32)
        account = Account.from_key(private_key)
        
        client_name = f"client{i}"
        accounts[client_name] = {
            "address": account.address,
            "private_key": private_key
        }
    
    # Save to JSON file
    with open('accounts.json', 'w') as f:
        json.dump(accounts, f, indent=4)
    
    print("Accounts generated and saved to accounts.json")
    return accounts

if __name__ == "__main__":
    try:
        accounts = generate_eth_accounts()
        print("\nGenerated accounts:")
        for client, details in accounts.items():
            print(f"\n{client}:")
            print(f"Address: {details['address']}")
            print(f"Private Key: {details['private_key']}")
    except Exception as e:
        print(f"Error: {e}")