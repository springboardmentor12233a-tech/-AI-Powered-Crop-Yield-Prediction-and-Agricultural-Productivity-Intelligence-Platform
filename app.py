import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from advisory_service import generate_agronomic_report

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load artifacts
try:
    champion_model = joblib.load('d:/data_practice/champion_agri_model.pkl')
    scaler = joblib.load('d:/data_practice/scaler.pkl')
    model_columns = joblib.load('d:/data_practice/model_columns.pkl')
except:
    champion_model, scaler, model_columns = None, None, None

class Features(BaseModel):
    State: str
    Crop: str
    Soil_Type: str
    Fertilizer: str
    N: float
    P: float
    K: float
    Soil_pH: float
    Rainfall_mm: float
    Temperature_C: float
    Year: int

@app.post("/api/predict")
async def predict_yield_and_advisory(features: Features):
    if not champion_model:
        raise HTTPException(status_code=500, detail="Model artifacts not loaded.")
    
    try:
        input_data = features.model_dump()
        df = pd.DataFrame([input_data])
        
        numerical_cols = ['N', 'P', 'K', 'Rainfall_mm', 'Temperature_C', 'Soil_pH', 'Year']
        categorical_cols = [col for col in df.columns if col not in numerical_cols]
        
        df_cat = pd.get_dummies(df[categorical_cols], drop_first=False) # Get all dummies first
        df_num = df[numerical_cols]
        df_num_scaled = pd.DataFrame(scaler.transform(df_num), columns=df_num.columns)
        
        df_processed = pd.concat([df_num_scaled, df_cat], axis=1)
        
        # Align with model columns
        for col in model_columns:
            if col not in df_processed.columns:
                df_processed[col] = 0
        df_processed = df_processed[model_columns]
        
        # Inference
        log_pred = champion_model.predict(df_processed)[0]
        predicted_yield = float(np.expm1(log_pred))
        
        report = generate_agronomic_report(input_data, predicted_yield)
        
        return {
            "predicted_yield_kg_per_acre": predicted_yield,
            "advisory_report": report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
