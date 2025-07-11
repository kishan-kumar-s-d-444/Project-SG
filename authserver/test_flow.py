from car_client import CarClient
import json
import requests

def test_oauth_flow():
    # Initialize the client
    client = CarClient(
        client_id='test_car_1',
        client_secret='test_secret_1',
        auth_server_url='http://localhost:5001',  # Updated port
        resource_server_url='http://localhost:5002'  # Resource server port
    )
    
    # Step 1: Get authorization code
    auth_response = requests.post(
        f"{client.auth_server_url}/authorize",
        json={
            'client_id': client.client_id,
            'client_secret': client.client_secret,
            'scope': 'engine_start door_unlock'
        }
    )
    
    if auth_response.status_code != 200:
        print("Failed to get authorization code:", auth_response.json())
        return
    
    auth_code = auth_response.json()['code']
    print("\n1. Got authorization code:", auth_code)
    
    # Step 2: Exchange code for token
    token = client.get_token(auth_code)
    if not token:
        print("Failed to get access token")
        return
    
    print("\n2. Got access token:", token)
    
    # Step 3: Prepare request with token
    request_data = client.prepare_request_with_token('vehicle/status')
    print("\n3. Prepared request with token:")
    print("URL:", request_data['url'])
    print("Headers:", json.dumps(request_data['headers'], indent=2))

if __name__ == "__main__":
    test_oauth_flow()
