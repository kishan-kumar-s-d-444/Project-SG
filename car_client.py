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
            'client_secret': self.client_secret,
            'grant_type': 'authorization_code'  # Required by OAuth 2.0
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

    def authorize(self, scope: str) -> Optional[str]:
        """
        First step: Request authorization from the auth server.
        Returns the authorization code if successful, None otherwise.
        """
        authorize_url = f"{self.auth_server_url}/authorize"
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'scope': scope
        }
        
        response = requests.post(authorize_url, json=data)
        if response.status_code == 200:
            return response.json().get('code')
        print(f"❌ Authorization failed: {response.json().get('error')}")
        return None
