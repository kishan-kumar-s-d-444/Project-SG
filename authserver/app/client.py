import requests
from typing import Optional

class CarClient:
    def __init__(self, client_id: str, client_secret: str, auth_server_url: str, resource_server_url: str):
        """Initialize the car client with necessary credentials and server URLs."""
        self.client_id = client_id
        self.client_secret = client_secret
        self.auth_server_url = auth_server_url.rstrip('/')
        self.resource_server_url = resource_server_url.rstrip('/')
        self.access_token = None

    def get_token(self, code: str) -> Optional[str]:
        """Exchange authorization code for access token."""
        token_url = f"{self.auth_server_url}/token"
        data = {
            'code': code,
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        response = requests.post(token_url, data=data)
        if response.status_code == 200:
            token_data = response.json()
            self.access_token = token_data.get('access_token')
            return self.access_token
        return None

    def prepare_request_with_token(self, endpoint: str) -> dict:
        """Prepare request headers with access token."""
        if not self.access_token:
            raise ValueError("No access token available. Call get_token first.")

        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        url = f"{self.resource_server_url}/{endpoint.lstrip('/')}"
        return {'url': url, 'headers': headers}

# Example usage:
if __name__ == "__main__":
    # Initialize the client
    client = CarClient(
        client_id="your_client_id",
        client_secret="your_client_secret",
        auth_server_url="http://localhost:5000",
        resource_server_url="http://localhost:5001"
    )

    # Get token
    auth_code = "your_auth_code"
    token = client.get_token(auth_code)
    
    if token:
        # Prepare request with token
        try:
            request_data = client.prepare_request_with_token('vehicle/status')
            print("Request URL:", request_data['url'])
            print("Request Headers:", request_data['headers'])
            
        except Exception as e:
            print(f"Error preparing request: {e}")
