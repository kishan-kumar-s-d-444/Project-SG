from car_client import CarClient
import json
import sys
from datetime import datetime

def test_auth_flow():
    print("🚗 Starting Car Authentication Flow Test")
    print(f"⏰ Test started at: {datetime.now()}\n")

    # 1. Initialize the CarClient
    print("Step 1: Initializing CarClient...")
    client = CarClient(
        client_id="test_car_1",         # Matches database
        client_secret="test_secret_1",   # Matches database
        auth_server_url="http://localhost:5001",  # Updated port to match run.py
        resource_server_url="http://localhost:5001"
    )
    print("✅ CarClient initialized\n")

    # 2. Request authorization
    print("Step 2: Requesting Authorization...")
    try:
        # Request multiple scopes
        scopes = ["engine_start", "door_unlock"]  # Matches allowed scopes in database
        scope_string = " ".join(scopes)
        print(f"📝 Requesting scopes: {scope_string}")
        
        auth_code = client.authorize(scope=scope_string)
        if not auth_code:
            print("❌ Authorization failed!")
            sys.exit(1)
        print(f"✅ Authorization successful!")
        print(f"🔑 Auth Code: {auth_code}\n")

        # 3. Exchange auth code for token
        print("Step 3: Exchanging Auth Code for Token...")
        token = client.get_token(auth_code)
        if not token:
            print("❌ Token exchange failed!")
            sys.exit(1)
        print("✅ Token received successfully!")
        print(f"🎟️ Token: {token}\n")

        # 4. Prepare authenticated request
        print("Step 4: Preparing Authenticated Request...")
        request_data = client.prepare_request_with_token('vehicle/battery')
        print("✅ Request prepared successfully!")
        print("📡 Request Details:")
        print(json.dumps(request_data, indent=2))

    except Exception as e:
        print(f"\n❌ Error during test: {str(e)}")
        sys.exit(1)

    print("\n✨ Test completed successfully!")

if __name__ == "__main__":
    test_auth_flow()
