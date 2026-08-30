import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

def train_production_model():
    # Load authentic dataset
    data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'crop_yield.csv'))
    print(f"Loading dataset from: {data_path}")
    
    df = pd.read_csv(data_path)
    df.dropna(inplace=True)
    
    # Map your CSV columns to the API schema features
    # Adjust these string names to exactly match your dataset's column headers
    X = df[['average_rain_fall_mm_per_year', 'avg_temp', 'pesticides_tonnes', 'Area']]
    y = df['hg/ha_yield'] 
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    predictions = model.predict(X_test)
    print(f"Production Model R2 Score: {r2_score(y_test, predictions):.4f}")
    
    models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'models'))
    joblib.dump(model, os.path.join(models_dir, 'crop_yield_model.pkl'))
    print("Production model saved successfully.")

if __name__ == "__main__":
    train_production_model()