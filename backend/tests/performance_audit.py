import time
from fastapi.testclient import TestClient
import os
import sys

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(BASE_DIR)

from backend.app.main import app

client = TestClient(app)

def main():
    print("=== BACKEND PERFORMANCE AUDIT ===")
    
    # We need to bypass auth or create a mock token.
    # The simplest way is to override the dependency get_current_user
    from backend.app.api.auth import get_current_user
    class MockUser:
        def __init__(self):
            self.id = 1
            self.email = "test@test.com"
            self.role_id = 2

    def override_get_current_user():
        return MockUser()
        
    app.dependency_overrides[get_current_user] = override_get_current_user

    # Sample input for ML endpoints
    sample_input = {
        "region": "Central USA",
        "crop_type": "Maize",
        "irrigation_type": "Drip",
        "fertilizer_type": "Inorganic",
        "crop_disease_status": "Mild",
        "soil_moisture_%": 35.5,
        "soil_pH": 6.8,
        "temperature_C": 24.5,
        "rainfall_mm": 120.0,
        "humidity_%": 65.0,
        "sunlight_hours": 8.5,
        "pesticide_usage_ml": 250.0,
        "total_days": 120,
        "latitude": 40.7,
        "longitude": -95.0,
        "NDVI_index": 0.65,
        "sowing_date": "2024-04-15",
        "observation_date": "2024-06-15"
    }

    endpoints = [
        ("/ml/predict", sample_input),
        ("/ml/weather-analysis", sample_input),
        ("/ml/soil-analysis", sample_input),
        ("/ml/agricultural-report", sample_input),
        ("/ml/llm-insights", sample_input),
    ]

    for path, payload in endpoints:
        print(f"Testing {path}...")
        # Warmup
        client.post(path, json=payload)
        
        # Measure
        start_time = time.time()
        for _ in range(5):
            resp = client.post(path, json=payload)
            if resp.status_code != 200:
                print(f"Error {resp.status_code}: {resp.text}")
        end_time = time.time()
        
        avg_latency = (end_time - start_time) / 5
        print(f"Average Latency for {path}: {avg_latency*1000:.2f} ms")
        
    # Also test /ml/chat if applicable
    chat_payload = {
        "message": "What is the best crop for sandy soil?",
        "context": None,
        "history": []
    }
    print("Testing /ml/chat...")
    start_time = time.time()
    resp = client.post("/ml/chat", json=chat_payload)
    end_time = time.time()
    if resp.status_code == 200:
        print(f"Latency for /ml/chat: {(end_time - start_time)*1000:.2f} ms")
    else:
        print(f"Error {resp.status_code} on /ml/chat: {resp.text}")

if __name__ == "__main__":
    main()
