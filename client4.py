from base_client import BaseClient
import os
import argparse

def get_telemetry_data(client):
    """Get telemetry data from the server"""
    print("\nGetting telemetry data...")
    telemetry = client.get_telemetry()
    
    if telemetry:
        print("\nTelemetry data retrieved successfully!")
    else:
        print("\nFailed to retrieve telemetry data")

def download_update_file(client, filename, version='1'):
    """Download and verify a file from the server"""
    print("\nTesting secure file download...")
    
    save_path = os.path.join('downloads', f'client4_{filename}_verified')
    success = client.download_file(
        filename,
        version=version,
        save_path=save_path
    )
    
    if success:
        print("\nFile downloaded and verified successfully!")
        # Show file contents
        with open(save_path, 'r') as f:
            print("\nFile contents:")
            print(f.read())
    else:
        print("\nFile verification failed!")

def main():
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Client4 operations')
    parser.add_argument('operation', type=int, choices=[1, 2], 
                      help='1: Get telemetry data, 2: Download file')
    parser.add_argument('--filename', type=str, default='client4_latest_update',
                      help='Name of file to download (only used with operation 2)')
    parser.add_argument('--version', type=str, default='1',
                      help='Version of file to download (only used with operation 2)')
    
    args = parser.parse_args()
    
    # Create client instance
    client = BaseClient('client4')
    
    if args.operation == 1:
        get_telemetry_data(client)
    else:
        download_update_file(client, args.filename, args.version)

if __name__ == "__main__":
    main()
