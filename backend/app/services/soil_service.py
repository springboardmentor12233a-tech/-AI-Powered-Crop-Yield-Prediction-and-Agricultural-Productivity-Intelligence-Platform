import os
import json

SOIL_JSON_PATH = os.path.join("datasets", "processed", "soil_analytics.json")

class SoilService:
    def get_soil_assessment(self, crop_type: str = None) -> dict:
        if not os.path.exists(SOIL_JSON_PATH):
            raise FileNotFoundError("Soil analytics data not found. Please run scripts/soil_analytics.py first.")

        with open(SOIL_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        if not crop_type:
            return data

        crop_breakdown = data.get("crop_specific_soil_breakdown", {})
        matched_crop = None
        for crop_key in crop_breakdown.keys():
            if crop_key.lower() == crop_type.strip().lower():
                matched_crop = crop_key
                break

        if not matched_crop:
            valid_crops = list(crop_breakdown.keys())
            raise ValueError(f"Crop type '{crop_type}' not found. Valid crops are: {valid_crops}")

        return {
            "status_claim": data.get("status_claim", "Dataset-based Crop-Aware Soil Analytics"),
            "crop_type": matched_crop,
            "soil_metrics": crop_breakdown[matched_crop],
            "global_soil_averages": data.get("global_soil_averages", {}),
            "general_reference_note": data.get("general_reference_note")
        }

soil_service = SoilService()
