#!/usr/bin/env python3
"""
Test script to verify deployment setup
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def test_frontend_build():
    """Test if frontend can be built"""
    print("Testing frontend build...")
    frontend_dir = Path("frontend")
    
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return False
    
    # Check if build directory exists or can be created
    build_dir = frontend_dir / "build"
    if build_dir.exists():
        print("✅ Frontend build directory exists")
        return True
    
    # Try to build
    try:
        result = subprocess.run(
            ["npm", "run", "build"], 
            cwd=frontend_dir, 
            capture_output=True, 
            text=True
        )
        if result.returncode == 0:
            print("✅ Frontend build successful")
            return True
        else:
            print(f"❌ Frontend build failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Frontend build error: {e}")
        return False

def test_backend_setup():
    """Test if backend can be set up"""
    print("Testing backend setup...")
    backend_dir = Path("backend")
    
    if not backend_dir.exists():
        print("❌ Backend directory not found")
        return False
    
    # Check if app.py exists
    app_file = backend_dir / "app.py"
    if not app_file.exists():
        print("❌ app.py not found")
        return False
    
    # Check if requirements.txt exists
    req_file = backend_dir / "requirements.txt"
    if not req_file.exists():
        print("❌ requirements.txt not found")
        return False
    
    print("✅ Backend files found")
    return True

def test_ngrok_installation():
    """Test if ngrok is available"""
    print("Testing ngrok installation...")
    try:
        result = subprocess.run(
            ["ngrok", "version"], 
            capture_output=True, 
            text=True
        )
        if result.returncode == 0:
            print("✅ ngrok is installed")
            return True
        else:
            print("❌ ngrok is not installed")
            return False
    except FileNotFoundError:
        print("❌ ngrok is not installed")
        return False

def test_port_availability():
    """Test if port 5000 is available"""
    print("Testing port 5000 availability...")
    try:
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', 5000))
        sock.close()
        
        if result == 0:
            print("⚠️  Port 5000 is already in use")
            return False
        else:
            print("✅ Port 5000 is available")
            return True
    except Exception as e:
        print(f"❌ Port test error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing deployment setup...")
    print("=" * 50)
    
    tests = [
        ("Frontend Build", test_frontend_build),
        ("Backend Setup", test_backend_setup),
        ("ngrok Installation", test_ngrok_installation),
        ("Port Availability", test_port_availability),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        if test_func():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your deployment should work.")
        print("\nTo deploy:")
        print("- Windows: Double-click deploy.bat")
        print("- Linux/Mac: ./deploy.sh")
        print("- Python: python build_and_deploy.py")
    else:
        print("❌ Some tests failed. Please fix the issues above.")
        print("\nCommon fixes:")
        print("- Install Node.js: https://nodejs.org/")
        print("- Install Python 3.7+: https://python.org/")
        print("- Install ngrok: https://ngrok.com/download")
        print("- Kill any process using port 5000")

if __name__ == "__main__":
    main() 