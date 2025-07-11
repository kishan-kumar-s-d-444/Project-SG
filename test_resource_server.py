import requests
import json

def test_resource_server():
    print("🚙 Testing Resource Server Token Verification")
    
    # Token from auth server (from test_auth_flow.py output)
    token = "eyJhbGciOiJIUzI1NiIsImtpZCI6ImNhci1hdXRoLWtleS0xIiwidHlwIjoiSldUIn0.eyJjbGllbnRfaWQiOiJ0ZXN0X2Nhcl8xIiwidmluIjoiVEVTVDEyMzQ1Njc4OTAxMjM0NSIsInNjb3BlIjoiZW5naW5lX3N0YXJ0IGRvb3JfdW5sb2NrIiwiZXhwIjoxNzM4NzcxMDYxLCJpYXQiOjE3Mzg3Njc0NjEsInRva2VuX3R5cGUiOiJjYXJfYWNjZXNzIn0.tbLhh1MxQz7jM04ZasAYE-M3MCM3Dbs3n9NGwZ2G2NI"
    
    # Test accessing protected endpoint
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        # Try to access telemetry endpoint for test_car_1
        print("\nTesting engine_start endpoint...")
        response = requests.get(
            'http://localhost:5002/api/telemetry/engine_start',  # Resource server runs on port 5002
            headers=headers
        )
        
        print("📡 Response Status:", response.status_code)
        print("📄 Response Body:")
        try:
            print(json.dumps(response.json(), indent=2))
        except:
            print(response.text)
            
        # Also try door unlock endpoint
        print("\nTesting door_unlock endpoint...")
        response = requests.get(
            'http://localhost:5002/api/telemetry/door_unlock',  # Another permitted endpoint
            headers=headers
        )
        
        print("📡 Response Status:", response.status_code)
        print("📄 Response Body:")
        try:
            print(json.dumps(response.json(), indent=2))
        except:
            print(response.text)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_resource_server()
