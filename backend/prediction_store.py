import json
import os
import time
import uuid
from collections import Counter

try:
    from .config import PREDICTIONS_FILE
except ImportError:
    from config import PREDICTIONS_FILE


class PredictionStore:
    def __init__(self):
        self.file_path = PREDICTIONS_FILE
        self._ensure_file()

    def _ensure_file(self):
        if not os.path.exists(self.file_path) or os.path.getsize(self.file_path) == 0:
            self._save_all([])

    def _load_all(self):
        if not os.path.exists(self.file_path):
            return []
        try:
            with open(self.file_path, "r") as f:
                return json.load(f)
        except Exception:
            return []

    def _save_all(self, data):
        with open(self.file_path, "w") as f:
            json.dump(data, f, indent=2)

    def add_prediction(
        self,
        request_dict: dict,
        predicted_yield: float,
        ai_analysis: str,
        ai_provider_used: str,
        user: dict = None
    ) -> dict:
        pred_id = f"pred_{uuid.uuid4().hex[:12]}"
        record = {
            "id": pred_id,
            "user_id": user["id"] if user else "guest",
            "user_email": user["email"] if user else "guest@agriyield.ai",
            "user_name": user.get("full_name", "Guest Farmer") if user else "Guest Farmer",
            "user_role": user.get("role", "farmer") if user else "guest",
            "Year": request_dict["Year"],
            "State_Name": request_dict["State_Name"],
            "Dist_Name": request_dict["Dist_Name"],
            "Crop": request_dict["Crop"],
            "Area": request_dict["Area"],
            "Previous_Year_Yield": request_dict["Previous_Year_Yield"],
            "Previous_Year_Area": request_dict["Previous_Year_Area"],
            "Previous_Year_Production": request_dict["Previous_Year_Production"],
            "predicted_yield": round(predicted_yield, 2),
            "unit": "Kg per ha",
            "model": "XGBoost",
            "ai_analysis": ai_analysis,
            "ai_provider_used": ai_provider_used,
            "created_at": time.time()
        }

        all_records = self._load_all()
        all_records.insert(0, record)  # Newest first
        self._save_all(all_records)
        return record

    def get_user_history(self, user_id: str) -> list:
        records = self._load_all()
        return [r for r in records if r.get("user_id") == user_id]

    def get_all_predictions(self) -> list:
        return self._load_all()

    def delete_prediction(self, pred_id: str, user: dict) -> bool:
        records = self._load_all()
        new_records = []
        found = False

        for r in records:
            if r["id"] == pred_id:
                if user.get("role") == "admin" or r.get("user_id") == user.get("id"):
                    found = True
                    continue
            new_records.append(r)

        if found:
            self._save_all(new_records)
        return found

    def get_admin_stats(self) -> dict:
        records = self._load_all()
        total_preds = len(records)
        crops = [r["Crop"] for r in records if "Crop" in r]
        states = [r["State_Name"] for r in records if "State_Name" in r]
        users = set(r["user_id"] for r in records if r.get("user_id") != "guest")
        providers = [r.get("ai_provider_used", "Groq") for r in records]

        crop_counts = dict(Counter(crops).most_common(5))
        state_counts = dict(Counter(states).most_common(5))
        provider_counts = dict(Counter(providers))

        avg_yield = round(
            sum(r["predicted_yield"] for r in records) / total_preds, 2
        ) if total_preds > 0 else 0.0

        return {
            "total_predictions": total_preds,
            "active_farmers_count": len(users),
            "average_predicted_yield": avg_yield,
            "top_crops": crop_counts,
            "top_states": state_counts,
            "ai_provider_usage": provider_counts,
            "recent_predictions": records[:8]
        }


prediction_store = PredictionStore()
