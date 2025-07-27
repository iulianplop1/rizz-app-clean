#!/usr/bin/env python3
"""
Build and deploy script for the Rizz application
This script builds the React frontend and starts the Flask backend with ngrok
"""

import os
import sys
import subprocess
import time
import json
import requests
from pathlib import Path

def run_command(command, cwd=None, check=True):
    """Run a shell command and return the result"""
    print(f"Running: {command}")
    result = subprocess.run(command, shell=True, cwd=cwd, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"Error running command: {command}")
        print(f"STDOUT: {result.stdout}")
        print(f"STDERR: {result.stderr}")
        sys.exit(1)
    return result

def check_ngrok_installed():
    """Check if ngrok is installed"""
    # Check for local ngrok.exe first
    if os.path.exists('ngrok.exe'):
        return True
    
    # Check for system ngrok
    try:
        result = subprocess.run(['ngrok', 'version'], capture_output=True, text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False

def install_ngrok():
    """Install ngrok if not already installed"""
    print("Installing ngrok...")
    if sys.platform == "win32":
        # Windows installation
        run_command("winget install ngrok.ngrok")
    else:
        # Linux/Mac installation
        run_command("curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null")
        run_command("echo 'deb https://ngrok-agent.s3.amazonaws.com buster main' | sudo tee /etc/apt/sources.list.d/ngrok.list")
        run_command("sudo apt update && sudo apt install ngrok")

def build_frontend():
    """Build the React frontend"""
    print("Building React frontend...")
    frontend_dir = Path("frontend")
    
    # Install dependencies if needed
    if not (frontend_dir / "node_modules").exists():
        print("Installing frontend dependencies...")
        run_command("npm install", cwd=frontend_dir)
    
    # Build the frontend
    run_command("npm run build", cwd=frontend_dir)
    print("Frontend built successfully!")

def start_backend():
    """Start the Flask backend"""
    print("Starting Flask backend...")
    backend_dir = Path("backend")
    
    # Install Python dependencies if needed
    if not (backend_dir / "venv").exists():
        print("Creating virtual environment...")
        run_command("python -m venv venv", cwd=backend_dir)
    
    # Activate virtual environment and install requirements
    if sys.platform == "win32":
        activate_cmd = "venv\\Scripts\\activate"
    else:
        activate_cmd = "source venv/bin/activate"
    
    run_command(f"{activate_cmd} && pip install -r requirements.txt", cwd=backend_dir)
    
    # Start the backend
    print("Starting backend server...")
    if sys.platform == "win32":
        run_command(f"{activate_cmd} && python app.py", cwd=backend_dir, check=False)
    else:
        run_command(f"{activate_cmd} && python app.py", cwd=backend_dir, check=False)

def start_ngrok():
    """Start ngrok tunnel"""
    print("Starting ngrok tunnel...")
    
    # Check if ngrok is installed
    if not check_ngrok_installed():
        print("ngrok not found. Installing...")
        install_ngrok()
    
    # Determine ngrok command
    ngrok_cmd = "ngrok.exe" if os.path.exists("ngrok.exe") else "ngrok"
    
    # Start ngrok tunnel
    print("Starting ngrok tunnel to port 5000...")
    run_command(f"{ngrok_cmd} http 5000", check=False)

def main():
    """Main deployment function"""
    print("🚀 Starting Rizz deployment...")
    
    # Build frontend
    build_frontend()
    
    # Start backend in background
    print("Starting backend server...")
    if sys.platform == "win32":
        subprocess.Popen("cd backend && venv\\Scripts\\activate && python app.py", shell=True)
    else:
        subprocess.Popen("cd backend && source venv/bin/activate && python app.py", shell=True)
    
    # Wait for backend to start
    print("Waiting for backend to start...")
    time.sleep(5)
    
    # Start ngrok
    print("Starting ngrok tunnel...")
    start_ngrok()
    
    print("\n🎉 Deployment complete!")
    print("Your app should now be accessible via the ngrok URL shown above.")
    print("Share this URL with your friends to let them try your app!")

if __name__ == "__main__":
    main() 