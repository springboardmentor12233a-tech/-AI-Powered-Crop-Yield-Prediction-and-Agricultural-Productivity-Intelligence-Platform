import os
import joblib
import pandas as pd
from openai import OpenAI


# ==============================
# 1. Load trained XGBoost model
# ==============================

model_path = "models/best_xgboost_model.pkl"
model = joblib.load(model_path)


# ==============================
# 2. Farmer / field input
# ==============================

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


# ==============================
# 3. Predict crop yield
# ==============================

prediction = model.predict(input_data)[0]

print("\n========================================")
print("       YIELDSENSE AI PREDICTION")
print("========================================")

print(f"\nPredicted Crop Yield: {prediction:.2f} tonnes/hectare")


# ==============================
# 4. Connect to Groq
# ==============================

client = OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)


# ==============================
# 5. Create agricultural prompt
# ==============================

prompt = f"""
You are an agricultural AI assistant for the YieldSense AI platform.

Analyze the following crop and environmental conditions.

Crop: {input_data['crop_type'][0]}
Region: {input_data['region'][0]}
Season: {input_data['season'][0]}

Soil:
- Soil pH: {input_data['soil_ph'][0]}
- Soil moisture: {input_data['soil_moisture'][0]}%
- Nitrogen: {input_data['nitrogen_content'][0]}
- Phosphorus: {input_data['phosphorus_content'][0]}
- Potassium: {input_data['potassium_content'][0]}

Weather:
- Average temperature: {input_data['avg_temperature'][0]} °C
- Total rainfall: {input_data['total_rainfall'][0]} mm
- Sunlight: {input_data['sunlight_hours'][0]} hours

Farm inputs:
- Fertilizer amount: {input_data['fertilizer_amount'][0]}
- Pesticide usage: {input_data['pesticide_usage'][0]}
- Irrigation frequency: {input_data['irrigation_frequency'][0]}

XGBoost predicted yield:
{prediction:.2f} tonnes/hectare

Provide a concise agricultural insight report containing:

1. Yield interpretation
2. Important soil observations
3. Weather observations
4. Irrigation recommendation
5. Fertilizer management advice
6. Risk factors
7. Three practical recommendations for the farmer

Do not claim that correlations prove causation.
Do not recommend unsafe pesticide or chemical usage.
"""


# ==============================
# 6. Generate AI insights
# ==============================

response = client.chat.completions.create(
    model="openai/gpt-oss-20b",
    messages=[
        {
            "role": "system",
            "content": "You are a helpful agricultural forecasting assistant."
        },
        {
            "role": "user",
            "content": prompt
        }
    ],
    temperature=0.4
)


# ==============================
# 7. Display result
# ==============================

insights = response.choices[0].message.content

print("\n========================================")
print("        AI AGRICULTURAL INSIGHTS")
print("========================================\n")

print(insights)

print("\n========================================")
print("       YIELDSENSE AI COMPLETE")
print("========================================")