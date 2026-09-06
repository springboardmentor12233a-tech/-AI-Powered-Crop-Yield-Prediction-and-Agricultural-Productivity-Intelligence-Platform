import pandas as pd
import joblib

# Load the trained model
model = joblib.load("models/best_xgboost_model.pkl")

# Sample input
sample_data = pd.DataFrame([{
    "soil_ph": 6.5,
    "soil_moisture": 35.0,
    "avg_temperature": 27.0,
    "total_rainfall": 800.0,
    "fertilizer_amount": 120.0,
    "pesticide_usage": 50.0,
    "sunlight_hours": 8.0,
    "nitrogen_content": 40.0,
    "phosphorus_content": 25.0,
    "potassium_content": 30.0,
    "irrigation_frequency": 5,
    "crop_type": "Wheat",
    "region": "North",
    "season": "Kharif",
    "harvest_year": 2021,
    "harvest_month": 7,
    "harvest_day": 15
}])

# Make prediction
prediction = model.predict(sample_data)

print("\nPredicted Crop Yield:")
print(f"{prediction[0]:.2f} tonnes/hectare")