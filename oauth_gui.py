import tkinter as tk
from tkinter import ttk, messagebox
import webbrowser
from combined_client import OAuthClient
import json

class OAuthGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("OAuth Flow GUI")
        self.root.geometry("800x600")
        
        self.oauth_client = None
        self.current_frame = None
        
        # Initialize the first frame
        self.show_credentials_frame()
    
    def clear_frame(self):
        if self.current_frame:
            self.current_frame.destroy()
        self.current_frame = tk.Frame(self.root, padx=20, pady=20)
        self.current_frame.pack(fill=tk.BOTH, expand=True)
    
    def show_credentials_frame(self):
        self.clear_frame()
        
        tk.Label(self.current_frame, text="Enter OAuth Credentials", font=('Arial', 14, 'bold')).pack(pady=10)
        
        # Client ID
        tk.Label(self.current_frame, text="Client ID:").pack()
        self.client_id_entry = tk.Entry(self.current_frame, width=50)
        self.client_id_entry.pack(pady=5)
        
        # Client Secret
        tk.Label(self.current_frame, text="Client Secret:").pack()
        self.client_secret_entry = tk.Entry(self.current_frame, width=50)
        self.client_secret_entry.pack(pady=5)
        
        # Mode Selection
        tk.Label(self.current_frame, text="Mode (1 for telemetry, 2 for file):").pack()
        self.mode_var = tk.StringVar(value="1")
        tk.Radiobutton(self.current_frame, text="Telemetry Data", variable=self.mode_var, value="1").pack()
        tk.Radiobutton(self.current_frame, text="File Access", variable=self.mode_var, value="2").pack()
        
        # Scope (only for telemetry mode)
        tk.Label(self.current_frame, text="Scope (for telemetry mode):").pack()
        self.scope_entry = tk.Entry(self.current_frame, width=50)
        self.scope_entry.pack(pady=5)
        
        tk.Button(self.current_frame, text="Start OAuth Flow", command=self.initialize_oauth).pack(pady=20)
    
    def initialize_oauth(self):
        client_id = self.client_id_entry.get()
        client_secret = self.client_secret_entry.get()
        mode = int(self.mode_var.get())
        scope = self.scope_entry.get() if mode == 1 else None
        
        if not client_id or not client_secret:
            messagebox.showerror("Error", "Please fill in all credentials")
            return
            
        self.oauth_client = OAuthClient(client_id, client_secret)
        
        try:
            auth_url = self.oauth_client.get_authorization_url(mode, scope)
            webbrowser.open(auth_url)
            self.show_auth_code_frame()
        except Exception as e:
            messagebox.showerror("Error", str(e))
    
    def show_auth_code_frame(self):
        self.clear_frame()
        
        tk.Label(self.current_frame, text="Authorization Code", font=('Arial', 14, 'bold')).pack(pady=10)
        tk.Label(self.current_frame, text="Please copy the authorization code from your browser:").pack()
        
        self.auth_code_entry = tk.Entry(self.current_frame, width=50)
        self.auth_code_entry.pack(pady=10)
        
        tk.Button(self.current_frame, text="Submit Authorization Code", command=self.process_auth_code).pack()
    
    def process_auth_code(self):
        auth_code = self.auth_code_entry.get()
        if not auth_code:
            messagebox.showerror("Error", "Please enter the authorization code")
            return
            
        try:
            token = self.oauth_client.get_token(auth_code)
            self.show_token_frame(token)
        except Exception as e:
            messagebox.showerror("Error", str(e))
    
    def show_token_frame(self, token):
        self.clear_frame()
        
        tk.Label(self.current_frame, text="Access Token", font=('Arial', 14, 'bold')).pack(pady=10)
        tk.Label(self.current_frame, text=f"Token: {token}").pack()
        
        tk.Button(self.current_frame, text="Request Resource", command=lambda: self.request_resource(token)).pack(pady=20)
    
    def request_resource(self, token):
        try:
            nonce = self.oauth_client.get_nonce(token)
            self.show_nonce_frame(nonce, token)
        except Exception as e:
            messagebox.showerror("Error", str(e))
    
    def show_nonce_frame(self, nonce, token):
        self.clear_frame()
        
        tk.Label(self.current_frame, text="Nonce Received", font=('Arial', 14, 'bold')).pack(pady=10)
        tk.Label(self.current_frame, text=f"Nonce: {nonce}").pack()
        
        tk.Button(self.current_frame, text="Send Signed Nonce", 
                 command=lambda: self.send_signed_nonce(nonce, token)).pack(pady=20)
    
    def send_signed_nonce(self, nonce, token):
        try:
            response = self.oauth_client.get_resource(nonce, token)
            self.show_result_frame(response)
        except Exception as e:
            messagebox.showerror("Error", str(e))
    
    def show_result_frame(self, response):
        self.clear_frame()
        
        tk.Label(self.current_frame, text="Resource Response", font=('Arial', 14, 'bold')).pack(pady=10)
        
        # Create a text widget to display the response
        text_widget = tk.Text(self.current_frame, height=10, width=60)
        text_widget.pack(pady=10)
        text_widget.insert(tk.END, json.dumps(response, indent=2))
        text_widget.config(state='disabled')
        
        tk.Button(self.current_frame, text="Start New Flow", 
                 command=self.show_credentials_frame).pack(pady=20)

if __name__ == "__main__":
    root = tk.Tk()
    app = OAuthGUI(root)
    root.mainloop() 