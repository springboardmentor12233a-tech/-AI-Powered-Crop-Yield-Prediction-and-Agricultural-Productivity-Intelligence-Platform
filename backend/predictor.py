import json

import joblib
import pandas as pd

from .config import METADATA_PATH, MODEL_PATH


class YieldPredictor:

    def __init__(self):
        print("Loading AgriYield XGBoost model...")

        self.model = joblib.load(MODEL_PATH)

        with open(METADATA_PATH, "r") as f:
            self.metadata = json.load(f)

        print("✅ Model loaded successfully!")

    def predict(
        self,
        Year,
        State_Name,
        Dist_Name,
        Crop,
        Area,
        Previous_Year_Yield,
        Previous_Year_Area,
        Previous_Year_Production
    ):

        input_data = pd.DataFrame([
            {
                "Year": Year,
                "State Name": State_Name,
                "Dist Name": Dist_Name,
                "Crop": Crop,
                "Area": Area,
                "Previous_Year_Yield": Previous_Year_Yield,
                "Previous_Year_Area": Previous_Year_Area,
                "Previous_Year_Production": Previous_Year_Production
            }
        ])

        prediction = self.model.predict(input_data)

        return float(prediction[0])