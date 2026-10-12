import sys, os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from test_new_features import (
    test_weather_search,
    test_weather_current,
    test_weather_forecast,
    test_crop_doctor_invalid_file_type,
    test_crop_doctor_history_empty,
    test_health_check
)

def run():
    print("--- Running Live Weather & Crop Doctor Tests ---")
    tests = [
        ("Health Check", test_health_check),
        ("Weather Search", test_weather_search),
        ("Weather Current", test_weather_current),
        ("Weather Forecast", test_weather_forecast),
        ("Crop Doctor File Validation", test_crop_doctor_invalid_file_type),
        ("Crop Doctor History", test_crop_doctor_history_empty),
    ]

    passed = 0
    failed = 0
    for name, fn in tests:
        try:
            fn()
            print(f"[PASS] {name}")
            passed += 1
        except Exception as e:
            print(f"[FAIL] {name}: {e}")
            failed += 1

    print(f"\nResults: {passed} passed, {failed} failed.")
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run()
