import subprocess
import sys
import os
import time

def main():
    print("Starting AI AgriYield Predictor...")
    print("1. Launching FastAPI Backend on port 8000...")
    
    # Start Backend with auto-reload
    backend_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd="d:/data_practice",
        stdout=sys.stdout,
        stderr=sys.stderr
    )
    
    # Give it a second to spin up
    time.sleep(2)
    
    print("2. Launching Vite React Frontend on port 5173...")
    
    # Start Frontend
    frontend_process = subprocess.Popen(
        "cmd /c npm run dev",
        cwd="d:/data_practice/frontend",
        stdout=sys.stdout,
        stderr=sys.stderr
    )
    
    try:
        print("\nAll services running. Press Ctrl+C to terminate both servers.")
        # Wait indefinitely until interrupted
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\nShutting down services...")
        backend_process.terminate()
        frontend_process.terminate()
        sys.exit(0)

if __name__ == "__main__":
    main()
