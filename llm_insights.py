import os
import pandas as pd
import joblib
from openai import OpenAI

# -----------------------------
# 1. Load XGBoost model
# -----------------------------
model = joblib.load("models/best_xgboost_model.pkl")

# -----------------------------
# 2. Agricultural input
# -----------------------------
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

# -----------------------------
# 3. Predict crop yield
# -----------------------------
prediction = model.predict(sample_data)[0]

print("\n===== YieldSense AI =====")
print(f"Predicted Yield: {prediction:.2f} tonnes/hectare")

# -----------------------------
# 4. Connect to Hugging Face
# -----------------------------
client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key=os.environ["HF_TOKEN"]
)

# -----------------------------
# 5. Create agricultural prompt
# -----------------------------
prompt = f"""
You are an agricultural AI assistant.

Analyze the following crop-yield prediction.

Crop: {sample_data["crop_type"].iloc[0]}
Region: {sample_data["region"].iloc[0]}
Season: {sample_data["season"].iloc[0]}

Soil pH: {sample_data["soil_ph"].iloc[0]}
Soil moisture: {sample_data["soil_moisture"].iloc[0]}
Average temperature: {sample_data["avg_temperature"].iloc[0]} °C
Total rainfall: {sample_data["total_rainfall"].iloc[0]} mm
Fertilizer amount: {sample_data["fertilizer_amount"].iloc[0]}
Pesticide usage: {sample_data["pesticide_usage"].iloc[0]}
Sunlight: {sample_data["sunlight_hours"].iloc[0]} hours
Nitrogen: {sample_data["nitrogen_content"].iloc[0]}
Phosphorus: {sample_data["phosphorus_content"].iloc[0]}
Potassium: {sample_data["potassium_content"].iloc[0]}
Irrigation frequency: {sample_data["irrigation_frequency"].iloc[0]}

Machine Learning predicted yield:
{prediction:.2f} tonnes/hectare

Provide:
1. A short interpretation of the predicted yield.
2. The main factors that may influence the result.
3. Three practical areas the farmer could monitor or review.

Do not claim certainty and do not provide unsafe chemical or pesticide instructions.
"""

# -----------------------------
# 6. Get AI insight
# -----------------------------
response = client.chat.completions.create(
    model="openai/gpt-oss-20b",
    messages=[
        {
            "role": "system",
            "content": "You are a helpful agricultural AI assistant."
        },
        {
            "role": "user",
            "content": prompt
        }
    ]
)

# -----------------------------
# 7. Display result
# -----------------------------
print("\n===== AI Agricultural Insights =====")
print(response.choices[0].message.content)