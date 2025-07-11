from web3 import Web3
import json

# Connect to blockchain
w3 = Web3(Web3.HTTPProvider('http://localhost:8545'))

# Load accounts
with open('accounts.json', 'r') as f:
    accounts = json.load(f)
    client_address = accounts['client']['address']

# Load contract
with open('contract.json', 'r') as f:
    contract_data = json.load(f)

contract = w3.eth.contract(
    address=contract_data['address'],
    abi=contract_data['abi']
)

# Check stored client address
stored_client = contract.functions.clientAddress().call()
print(f"Contract address: {contract_data['address']}")
print(f"Expected client: {client_address}")
print(f"Stored client: {stored_client}")
print(f"Match: {stored_client.lower() == client_address.lower()}")