from web3 import Web3
import json

def create_accounts():
    try:
        # Connect to your local Geth node
        w3 = Web3(Web3.HTTPProvider('http://localhost:8545'))
        
        # Check connection
        if not w3.is_connected():
            raise Exception("Not connected to Ethereum node")

        # Get the default dev account (which has funds)
        dev_account = w3.eth.accounts[0]
        print(f'Developer Account: {dev_account}')

        # Create new accounts
        client_account = w3.eth.account.create()
        resource_server_account = w3.eth.account.create()

        print('\nClient Account:')
        print(f'Address: {client_account.address}')
        print(f'Private Key: {client_account.key.hex()}')

        print('\nResource Server Account:')
        print(f'Address: {resource_server_account.address}')
        print(f'Private Key: {resource_server_account.key.hex()}')

        # Fund the new accounts
        amount = w3.to_wei(1, 'ether')  # 1 ETH

        # Send ETH to client account
        tx_hash = w3.eth.send_transaction({
            'from': dev_account,
            'to': client_account.address,
            'value': amount
        })
        w3.eth.wait_for_transaction_receipt(tx_hash)

        # Send ETH to resource server account
        tx_hash = w3.eth.send_transaction({
            'from': dev_account,
            'to': resource_server_account.address,
            'value': amount
        })
        w3.eth.wait_for_transaction_receipt(tx_hash)

        # Check balances
        client_balance = w3.eth.get_balance(client_account.address)
        resource_balance = w3.eth.get_balance(resource_server_account.address)

        print('\nBalances:')
        print(f'Client Balance: {w3.from_wei(client_balance, "ether")} ETH')
        print(f'Resource Server Balance: {w3.from_wei(resource_balance, "ether")} ETH')

        # Save accounts to file
        accounts_data = {
            'client': {
                'address': client_account.address,
                'private_key': client_account.key.hex()
            },
            'resource_server': {
                'address': resource_server_account.address,
                'private_key': resource_server_account.key.hex()
            }
        }

        with open('accounts.json', 'w') as f:
            json.dump(accounts_data, f, indent=2)
        print('\nAccounts saved to accounts.json')

    except Exception as e:
        print(f'Error: {str(e)}')

if __name__ == "__main__":
    create_accounts()