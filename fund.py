# fund_account.py
from web3 import Web3
import json

# Connect to local blockchain
w3 = Web3(Web3.HTTPProvider('http://localhost:8545'))

# Load accounts
with open('accounts.json', 'r') as f:
    accounts = json.load(f)

# Get the dev account (which has initial funds)
dev_account = w3.eth.accounts[0]

# Send ETH to resource server
tx_hash = w3.eth.send_transaction({
    'from': dev_account,
    'to': accounts['resource_server']['address'],
    'value': w3.to_wei(10, 'ether')  # Send 10 ETH
})

# Wait for transaction
receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
print(f"Funded resource server account with 10 ETH")

# Check balance
balance = w3.eth.get_balance(accounts['resource_server']['address'])
print(f"Resource server balance: {w3.from_wei(balance, 'ether')} ETH")