from base_client import BaseClient
import os

def main():
    # Create client instance
    client = BaseClient('client1')
    
    print("\nTesting secure file download...")
    
    # Try downloading the update file
    success = client.download_file(
        'client1_latest_update',
        version='1',
        save_path='downloads/client1_update_verified'
    )
    
    if success:
        print("\nFile downloaded and verified successfully!")
        # Show file contents
        with open('downloads/client1_update_verified', 'r') as f:
            print("\nFile contents:")
            print(f.read())
    else:
        print("\nFile verification failed!")

if __name__ == "__main__":
    main()
