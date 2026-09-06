import pandas as pd
import joblib

print("=" * 60)
print("REAL-TIME CROP YIELD PREDICTION")
print("=" * 60)

# --------------------------------------------------
# 1. Load trained model
# --------------------------------------------------
model_path = "models/best_xgboost_model.pkl"

model = joblib.load(model_path)

# --------------------------------------------------
# 2. Example real-time input
# --------------------------------------------------
input_data = pd.DataFrame([{
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
    "season": "Summer",
    "harvest_year": 2021,
    "harvest_month": 7,
    "harvest_day": 15
}])

# --------------------------------------------------
# 3. Generate prediction
# --------------------------------------------------
prediction = model.predict(input_data)[0]

# --------------------------------------------------
# 4. Display result
# --------------------------------------------------
print("\nINPUT CONDITIONS")
print("-" * 60)

for column, value in input_data.iloc[0].items():
    print(f"{column:<25}: {value}")

print("\n" + "=" * 60)
print("PREDICTION RESULT")
print("=" * 60)

print(f"Predicted Crop Yield: {prediction:.2f} tonnes/hectare")

# --------------------------------------------------
# 5. Basic interpretation
# --------------------------------------------------
if prediction < 5:
    category = "Low predicted yield"
elif prediction < 7:
    category = "Moderate predicted yield"
else:
    category = "High predicted yield"

print(f"Yield Category: {category}")

print("\nPrediction generated successfully.")