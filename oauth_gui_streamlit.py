import streamlit as st
from combined_client import CombinedClient
import json
from web3 import Web3
import jwt
from datetime import datetime
import os
from dotenv import load_dotenv
from eth_account.messages import encode_defunct

# Must be the first Streamlit command
st.set_page_config(page_title="OAuth Flow GUI", layout="wide", page_icon="🔐")

# Custom CSS for styling
st.markdown("""
    <style>
        .header {
            padding: 20px;
            background: linear-gradient(90deg, #4b6cb7 0%, #182848 100%);
            color: white;
            border-radius: 10px;
        }
        .step-container {
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 10px;
            margin: 10px 0;
        }
        .success-box {
            padding: 15px;
            background-color: #e8f5e9;
            border-left: 5px solid #2e7d32;
            border-radius: 5px;
            margin: 10px 0;
        }
        .error-box {
            padding: 15px;
            background-color: #ffebee;
            border-left: 5px solid #c62828;
            border-radius: 5px;
            margin: 10px 0;
        }
        .info-box {
            padding: 15px;
            background-color: #e3f2fd;
            border-left: 5px solid #1976d2;
            border-radius: 5px;
            margin: 10px 0;
        }
    </style>
""", unsafe_allow_html=True)

# Load environment variables
load_dotenv()

def verify_token(token):
    """Verify the JWT token"""
    try:
        # Use the same secret key as the auth server and resource server
        secret_key = os.getenv('SECRET_KEY', 'your-secret-key')  # Make sure this matches your auth server's key
        
        # Extract token from Bearer format if present
        if token.startswith('Bearer '):
            token = token.split(' ')[1]
        
        # Get unverified headers first for debugging
        headers = jwt.get_unverified_header(token)
        st.write("Token headers:", headers)
        
        # Get unverified payload for debugging
        try:
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            st.write("Unverified payload:", unverified_payload)
        except Exception as e:
            st.error(f"Error decoding unverified payload: {str(e)}")
            return False, "Error decoding token payload"
        
        # Try different algorithms if HS256 fails
        algorithms = ['HS256', 'RS256']
        for algorithm in algorithms:
            try:
                payload = jwt.decode(token, secret_key, algorithms=[algorithm])
                st.write(f"Token successfully verified with {algorithm}")
                st.write("Verified payload:", payload)
                
                # Verify required claims
                if not all(k in payload for k in ['client_id', 'vin', 'scope']):
                    return False, "Token missing required claims"
                    
                return True, payload
            except jwt.InvalidAlgorithmError:
                continue
            except Exception as e:
                st.write(f"Failed with {algorithm}: {str(e)}")
                continue
                
        return False, "Could not verify token with any supported algorithm"
        
    except jwt.ExpiredSignatureError:
        return False, "Token has expired"
    except jwt.InvalidTokenError as e:
        return False, f"Invalid token: {str(e)}"

def step_progress(current_step):
    steps = {
        1: "🚀 Start",
        1.5: "🔑 Auth Code",
        2: "🔐 Token Exchange",
        2.5: "✅ Token Validation",
        2.75: "🔐 Nonce Signing",
        3: "📡 Resource Access",
        4: "🏁 Complete"
    }
    return f"**Step {current_step}**: {steps.get(current_step, '')}"

def main():
    # Custom header (moved page config out)
    st.markdown('<div class="header"><h1>🔐 Secure Car API Access</h1></div>', unsafe_allow_html=True)
    
    # Initialize session state
    if 'step' not in st.session_state:
        st.session_state.step = 1
    if 'client' not in st.session_state:
        st.session_state.client = None

    # Progress tracker
    st.sidebar.markdown("## Progress Tracker")
    current_progress = st.session_state.step / 4  # Convert to value between 0 and 1
    st.sidebar.progress(current_progress)
    st.sidebar.markdown(f"**Current Step:** {step_progress(st.session_state.step)}")

    # Main content container
    with st.container():
        # Step 1: Initial Setup
        if st.session_state.step == 1:
            st.markdown("## 🚀 Step 1: Client Configuration")
            with st.expander("⚙️ Configure Client Settings", expanded=True):
                col1, col2 = st.columns(2)
                with col1:
                    client_id = st.text_input("**Client ID**", value="tesla_models_3", help="Your unique client identifier")
                    auth_server = st.text_input("**Authorization Server URL**", value="http://localhost:5001")
                with col2:
                    client_secret = st.text_input("**Client Secret**", value="tesla_secret_3", type="password", help="Keep this secure!")
                    resource_server = st.text_input("**Resource Server URL**", value="http://localhost:5002")

                mode = st.radio("**Select Access Mode**", 
                              ["📊 Telemetry Data", "📥 File Download"],
                              index=0,
                              help="Choose between real-time data access or file downloads")
                
                # Store mode as string "1" or "2"
                st.session_state.mode = "1" if mode == "📊 Telemetry Data" else "2"

                # Handle scopes based on mode
                if mode == "📊 Telemetry Data":
                    scopes = st.multiselect(
                        "**Select Scopes**",
                        ["engine_start", "door_unlock"],
                        default=["engine_start", "door_unlock"],
                        help="Required permissions for telemetry access"
                    )
                else:  # File Download mode
                    st.info("📥 File Download mode selected - using file_download scope")
                    scopes = ["file_download"]
                    # Display the scope being used
                    st.code("Scope: file_download")

                if st.button("🚀 Initialize Authorization", use_container_width=True):
                    with st.spinner("Initializing authorization..."):
                        try:
                            # Create client instance
                            client = CombinedClient(
                                client_id=client_id,
                                client_secret=client_secret,
                                auth_server_url=auth_server,
                                resource_server_url=resource_server
                            )
                            
                            # Store client in session state
                            st.session_state.client = client
                            
                            # Create scope string
                            scope_string = " ".join(scopes)
                            
                            # Debug information display (outside expander)
                            st.markdown("### 🔍 Configuration Details")
                            st.markdown("""
                                <style>
                                    .debug-box {
                                        padding: 15px;
                                        background-color: #f8f9fa;
                                        border-radius: 5px;
                                        margin: 10px 0;
                                    }
                                </style>
                            """, unsafe_allow_html=True)
                            
                            st.markdown('<div class="debug-box">', unsafe_allow_html=True)
                            st.write("Mode:", st.session_state.mode)
                            st.write("Scopes:", scope_string)
                            st.write("Client ID:", client_id)
                            st.write("Auth Server:", auth_server)
                            st.write("Resource Server:", resource_server)
                            st.markdown('</div>', unsafe_allow_html=True)
                            
                            # Attempt authorization
                            auth_code = client.authorize(scope=scope_string)
                            
                            if auth_code:
                                st.session_state.generated_auth_code = auth_code
                                st.session_state.step = 1.5
                                st.rerun()
                            else:
                                st.error("❌ Authorization failed! Check configuration details above.")
                        except Exception as e:
                            st.error(f"🚨 Error: {str(e)}")
                            # Show error details without using expander
                            st.markdown("### ❌ Error Details")
                            st.markdown('<div class="debug-box">', unsafe_allow_html=True)
                            st.write("Detailed error:", str(e))
                            st.write("Current Configuration:", {
                                "mode": st.session_state.mode,
                                "scopes": scopes,
                                "client_id": client_id,
                                "auth_server": auth_server,
                                "resource_server": resource_server
                            })
                            st.markdown('</div>', unsafe_allow_html=True)

        # Step 1.5: Validate Authorization Code
        elif st.session_state.step == 1.5:
            st.markdown("## 🔑 Step 1.5: Authorization Code Validation")
            with st.expander("📋 Generated Authorization Code", expanded=True):
                st.code(st.session_state.generated_auth_code, language="text")
            
            input_auth_code = st.text_input("✍️ Enter Authorization Code")
            
            col1, col2 = st.columns([1, 2])
            with col1:
                if st.button("🔍 Validate Code", use_container_width=True):
                    if input_auth_code == st.session_state.generated_auth_code:
                        st.session_state.auth_code = input_auth_code
                        st.session_state.step = 2
                        st.rerun()
                    else:
                        st.markdown('<div class="error-box">❌ Invalid authorization code!</div>', unsafe_allow_html=True)
            with col2:
                if st.button("🔄 Back to Configuration", use_container_width=True):
                    st.session_state.step = 1
                    st.rerun()

        # Step 2: Token Exchange
        elif st.session_state.step == 2:
            st.markdown("## 🔐 Step 2: Token Exchange")
            with st.container():
                if st.button("🪙 Generate Access Token", use_container_width=True):
                    with st.spinner("Generating token..."):
                        try:
                            token = st.session_state.client.get_token(st.session_state.auth_code)
                            if token:
                                st.session_state.generated_token = token
                                st.session_state.step = 2.5
                                st.rerun()
                            else:
                                st.markdown('<div class="error-box">❌ Token generation failed!</div>', unsafe_allow_html=True)
                        except Exception as e:
                            st.markdown(f'<div class="error-box">🚨 Error: {str(e)}</div>', unsafe_allow_html=True)

        # Step 2.5: Token Validation with Resource Server
        elif st.session_state.step == 2.5:
            st.markdown("## 🔒 Step 2.5: Token Validation")
            
            # Display the generated token
            with st.expander("🔍 View Generated Token", expanded=True):
                st.code(st.session_state.generated_token, language="text")
            
            # Button to send token to resource server
            if 'token_validated' not in st.session_state:
                if st.button("🚀 Send Token to Resource Server", use_container_width=True, type="primary"):
                    with st.spinner("Sending token to resource server..."):
                        try:
                            # Ensure token is in correct format
                            token = st.session_state.generated_token
                            if not token.startswith('Bearer '):
                                token = f'Bearer {token}'
                            
                            # Store token in session state
                            st.session_state.token = token
                            
                            # Verify token with resource server
                            is_valid, message = verify_token(token)
                            
                            if is_valid:
                                st.session_state.token_validated = True
                                st.markdown('<div class="success-box">✅ Token successfully validated by resource server!</div>', 
                                          unsafe_allow_html=True)
                                st.rerun()
                            else:
                                st.markdown(f'<div class="error-box">❌ Token validation failed: {message}</div>', 
                                          unsafe_allow_html=True)
                        except Exception as e:
                            st.markdown(f'<div class="error-box">🚨 Error: {str(e)}</div>', 
                                      unsafe_allow_html=True)
            
            # If token is validated, show proceed button
            if st.session_state.get('token_validated'):
                st.markdown("### Token Status")
                st.markdown('<div class="info-box">ℹ️ Token has been validated by the resource server</div>', 
                          unsafe_allow_html=True)
                
                # Navigation options
                col1, col2 = st.columns([2, 1])
                with col1:
                    if st.button("▶️ Proceed to Nonce Reception", use_container_width=True, type="primary"):
                        st.session_state.step = 2.75
                        st.rerun()
                with col2:
                    if st.button("🔄 Validate Again", use_container_width=True):
                        del st.session_state.token_validated
                        st.rerun()
            
            # Always show back button
            if st.button("⬅️ Back to Token Generation", use_container_width=True):
                st.session_state.step = 2
                st.rerun()

        # Step 2.75: Receive Nonce from Resource Server
        elif st.session_state.step == 2.75:
            st.markdown("## 🔢 Step 2.75: Receive Nonce")
            
            # Display current progress
            st.info("🔑 Token validated successfully. Now waiting to receive nonce.")
            
            # Button to request nonce
            if 'nonce' not in st.session_state:
                if st.button("📥 Request Nonce", use_container_width=True, type="primary"):
                    with st.spinner("Requesting nonce..."):
                        try:
                            nonce = st.session_state.client.w3.eth.get_transaction_count(
                                st.session_state.client.address
                            )
                            st.session_state.nonce = nonce
                            st.rerun()
                        except Exception as e:
                            st.error(f"Error getting nonce: {str(e)}")
            
            # Display nonce if available
            if 'nonce' in st.session_state:
                st.markdown("""
                    <style>
                        .nonce-box {
                            padding: 20px;
                            background-color: #f8f9fa;
                            border: 2px solid #1976d2;
                            border-radius: 10px;
                            margin: 20px 0;
                            font-family: monospace;
                            font-size: 1.2em;
                        }
                    </style>
                """, unsafe_allow_html=True)
                
                st.markdown("### 🔢 Received Nonce")
                st.markdown(f'<div class="nonce-box">Current Nonce: {st.session_state.nonce}</div>', 
                          unsafe_allow_html=True)
                
                # Display Ethereum account details
                with st.expander("👤 Account Details", expanded=True):
                    st.markdown(f"""
                    ```
                    Address: {st.session_state.client.address}
                    Private Key: {st.session_state.client.private_key[:10]}...
                    Current Nonce: {st.session_state.nonce}
                    ```
                    """)
                
                # Navigation buttons
                col1, col2 = st.columns([2, 1])
                with col1:
                    if st.button("▶️ Proceed to Sign Nonce", use_container_width=True, type="primary"):
                        st.session_state.step = 2.8
                        st.rerun()
                with col2:
                    if st.button("🔄 Request New Nonce", use_container_width=True):
                        del st.session_state.nonce
                        st.rerun()
            
            # Back button
            if st.button("⬅️ Back to Token Validation", use_container_width=True):
                st.session_state.step = 2.5
                st.rerun()

        # Step 2.8: Sign Nonce
        elif st.session_state.step == 2.8:
            st.markdown("## ✍️ Step 2.8: Sign Nonce")
            
            # Display current nonce
            st.markdown("""
                <style>
                    .nonce-box {
                        padding: 20px;
                        background-color: #f8f9fa;
                        border: 2px solid #1976d2;
                        border-radius: 10px;
                        margin: 20px 0;
                        font-family: monospace;
                        font-size: 1.2em;
                    }
                </style>
            """, unsafe_allow_html=True)
            
            # Ensure nonce exists and is displayed
            if 'nonce' not in st.session_state:
                st.error("⚠️ No nonce found. Please go back and request a nonce first.")
                if st.button("⬅️ Back to Nonce Reception", use_container_width=True):
                    st.session_state.step = 2.75
                    st.rerun()
            else:
                st.markdown("### 🔢 Nonce to Sign")
                st.markdown(f'<div class="nonce-box">Current Nonce: {st.session_state.nonce}</div>', 
                          unsafe_allow_html=True)
                
                # Button to sign nonce
                if 'signature' not in st.session_state:
                    if st.button("📝 Sign Nonce", use_container_width=True, type="primary"):
                        with st.spinner("Signing nonce..."):
                            try:
                                # Create message to sign (convert nonce to string)
                                message = f"Nonce: {str(st.session_state.nonce)}"
                                message_bytes = message.encode('utf-8')
                                
                                # Sign the message using eth_account
                                signed_message = st.session_state.client.w3.eth.account.sign_message(
                                    encode_defunct(message_bytes),  # Use encode_defunct for proper message formatting
                                    private_key=st.session_state.client.private_key
                                )
                                
                                # Store signature and message in session state
                                st.session_state.signature = signed_message.signature.hex()
                                st.session_state.signed_message = message
                                st.rerun()
                                
                            except Exception as e:
                                st.error(f"Error during signing: {str(e)}")
                                st.error("Detailed error info:")
                                st.write(e)
                
                # Display signature details if available
                if 'signature' in st.session_state:
                    st.markdown("### 📋 Signature Details")
                    st.markdown("""
                        <style>
                            .signature-box {
                                padding: 20px;
                                background-color: #e3f2fd;
                                border: 2px solid #1976d2;
                                border-radius: 10px;
                                margin: 20px 0;
                                font-family: monospace;
                                word-wrap: break-word;
                            }
                        </style>
                    """, unsafe_allow_html=True)
                    
                    st.markdown('<div class="signature-box">' + 
                              f'<strong>Message:</strong> {st.session_state.signed_message}<br><br>' +
                              f'<strong>Signature:</strong> {st.session_state.signature}' +
                              '</div>', 
                              unsafe_allow_html=True)
                    
                    # Verify signature
                    try:
                        message_bytes = st.session_state.signed_message.encode('utf-8')
                        recovered_address = st.session_state.client.w3.eth.account.recover_message(
                            encode_defunct(message_bytes),  # Use encode_defunct here as well
                            signature=bytes.fromhex(st.session_state.signature)
                        )
                        
                        # Check if recovered address matches
                        if recovered_address.lower() == st.session_state.client.address.lower():
                            st.markdown('<div class="success-box">✅ Signature verified successfully!</div>', unsafe_allow_html=True)
                            
                            # Navigation options
                            col1, col2, col3 = st.columns([2, 1, 1])
                            with col1:
                                if st.button("▶️ Proceed to Resource Access", use_container_width=True, type="primary"):
                                    st.session_state.step = 3
                                    st.rerun()
                            with col2:
                                if st.button("🔄 Sign Again", use_container_width=True):
                                    del st.session_state.signature
                                    del st.session_state.signed_message
                                    st.rerun()
                            with col3:
                                if st.button("⬅️ Back", use_container_width=True):
                                    st.session_state.step = 2.75
                                    st.rerun()
                        else:
                            st.markdown('<div class="error-box">❌ Signature verification failed!</div>', unsafe_allow_html=True)
                            if st.button("🔄 Try Again", use_container_width=True):
                                del st.session_state.signature
                                del st.session_state.signed_message
                                st.rerun()
                    except Exception as e:
                        st.error(f"Error during verification: {str(e)}")

        # Step 3: Resource Access
        elif st.session_state.step == 3:
            st.markdown("## 📡 Step 3: Resource Access")
            
            if st.session_state.mode == "1":  # Telemetry Data mode
                st.info("🚗 Request real-time vehicle telemetry data")
                
                # Display current token
                with st.expander("🔑 Current Token", expanded=False):
                    st.code(st.session_state.token)
                
                if st.button("📡 Request Telemetry Data", use_container_width=True):
                    with st.spinner("Fetching telemetry data..."):
                        try:
                            # Ensure token is in correct format
                            token = st.session_state.token
                            if not token.startswith('Bearer '):
                                token = f'Bearer {token}'
                            
                            # Update client token
                            st.session_state.client.token = token
                            
                            # Make the request with scope
                            response = st.session_state.client.get_data("engine_start")
                            
                            if response:
                                try:
                                    # Try to parse JSON if response is string
                                    if isinstance(response, str):
                                        data = json.loads(response)
                                    else:
                                        data = response
                                    
                                    # Store data for viewing in final step
                                    st.session_state.last_data = data
                                    
                                    # Display success message
                                    st.success("✅ Telemetry data received successfully!")
                                    
                                    # Display formatted data
                                    st.markdown("### 📊 Telemetry Data")
                                    st.json(data)
                                    
                                    # Show debug information
                                    with st.expander("🔍 Debug Information", expanded=False):
                                        st.write("Token used:", token)
                                        st.write("Raw response:", response)
                                    
                                    # Show the Next Step button
                                    if st.button("▶️ Next Step", use_container_width=True, type="primary"):
                                        st.session_state.step = 4
                                        st.rerun()
                                    
                                except json.JSONDecodeError as e:
                                    st.error(f"Error parsing response: {str(e)}")
                                    st.write("Raw response:", response)
                            else:
                                st.error("❌ No data received from server")
                                st.write("Please check server connection and try again")
                                
                                # Show debug information
                                with st.expander("🔍 Debug Information", expanded=True):
                                    st.write("Token used:", token)
                                    st.write("Client Configuration:", {
                                        "client_id": st.session_state.client.client_id,
                                        "auth_server": st.session_state.client.auth_server,
                                        "resource_server": st.session_state.client.resource_server
                                    })
                        
                        except Exception as e:
                            st.error(f"🚨 Error fetching data: {str(e)}")
                            # Detailed debug information
                            with st.expander("🔍 Debug Information", expanded=True):
                                st.write("Token State:", st.session_state.token)
                                st.write("Client Configuration:", {
                                    "client_id": st.session_state.client.client_id,
                                    "auth_server": st.session_state.client.auth_server,
                                    "resource_server": st.session_state.client.resource_server
                                })
                                st.write("Error Details:", str(e))
                
                # Add navigation buttons
                col1, col2 = st.columns([1, 4])
                with col1:
                    if st.button("⬅️ Back", use_container_width=True):
                        st.session_state.step = 2.8
                        st.rerun()
                with col2:
                    if st.button("⏭️ Skip to Complete", use_container_width=True):
                        st.session_state.step = 4
                        st.rerun()
            else:
                col1, col2 = st.columns(2)
                with col1:
                    filename = st.text_input("📄 Filename", value="latest_update")
                with col2:
                    version = st.text_input("🔢 Version", value="1")
                
                if st.button("📥 Download File", use_container_width=True):
                    with st.spinner("Downloading file..."):
                        try:
                            success = st.session_state.client.download_file(
                                filename=filename,
                                version=version,
                                save_path=f"downloads/{st.session_state.client.client_id}_{filename}.txt"
                            )
                            if success:
                                st.markdown(f'<div class="success-box">✅ File saved to downloads/{st.session_state.client.client_id}_{filename}.txt</div>', unsafe_allow_html=True)
                                st.session_state.step = 4
                                st.rerun()
                            else:
                                st.markdown('<div class="error-box">❌ Download failed!</div>', unsafe_allow_html=True)
                        except Exception as e:
                            st.markdown(f'<div class="error-box">🚨 Error: {str(e)}</div>', unsafe_allow_html=True)

        # Step 4: Complete
        elif st.session_state.step == 4:
            st.markdown("## 🏁 Process Complete")
            
            # Custom CSS for F1 car animation and blue success message
            st.markdown("""
                <style>
                    @keyframes drive {
                        from { transform: translateX(200%); }
                        to { transform: translateX(-100%); }
                    }
                    .f1-car {
                        font-size: 80px;  /* Increased size from 50px to 80px */
                        animation: drive 3s linear;
                        white-space: nowrap;
                        position: relative;
                    }
                    .blue-success-box {
                        padding: 15px;
                        background-color: #1976d2;
                        color: white;
                        border-radius: 5px;
                        margin: 10px 0;
                        text-align: center;
                        font-weight: bold;
                    }
                </style>
                <div class="f1-car">🏎️</div>
                <div class="blue-success-box">🎉 All operations completed successfully!</div>
            """, unsafe_allow_html=True)
            
            # Display summary of the completed process
            with st.expander("📋 Session Summary", expanded=True):
                st.write("✅ Client Configuration")
                st.write("✅ Authorization Code Generation")
                st.write("✅ Token Exchange")
                st.write("✅ Resource Access")
            
            # Add prominent button to start new session
            if st.button("🔄 Start New Session", use_container_width=True, type="primary"):
                # Clear all session state variables
                for key in list(st.session_state.keys()):
                    del st.session_state[key]
                # Reset to step 1
                st.session_state.step = 1
                st.rerun()
            
            # Add secondary button for viewing results again
            if st.button("📊 View Last Results", use_container_width=True):
                if st.session_state.mode == "1":
                    with st.expander("📊 Last Telemetry Data", expanded=True):
                        st.json(st.session_state.get('last_data', {}))
                else:
                    st.info(f"📁 File was downloaded to: downloads/{st.session_state.client.client_id}_latest_update.txt")

if __name__ == "__main__":
    main()