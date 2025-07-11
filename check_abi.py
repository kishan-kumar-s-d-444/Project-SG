import json

# Read the contract.json file
with open('contract.json', 'r') as f:
    contract_data = json.load(f)

# Print the ABI
print("Contract Address:", contract_data['address'])
print("\nAvailable functions:")
for item in contract_data['abi']:
    if item.get('type') == 'function':
        print(f"- {item['name']}")