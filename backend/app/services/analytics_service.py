import os
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.db.models import User, Farm, Crop, Prediction


class AnalyticsService:
    """
    Agricultural Analytics & Risk Analysis Engine for YieldSense AI.
    Provides statistical insights on crop yield, soil health, weather impact,
    and calculates agronomic risk scores & farmer recommendations.
    """

    def __init__(self, dataset_path: Optional[Path] = None):
        if dataset_path:
            self.dataset_path = Path(dataset_path)
        else:
            self.dataset_path = PROJECT_ROOT / "dataset" / "processed" / "crop_yield_cleaned.csv"
            if not self.dataset_path.exists():
                self.dataset_path = PROJECT_ROOT / "dataset.csv"

        self._load_dataset()

    def _load_dataset(self):
        if self.dataset_path.exists():
            self.df = pd.read_csv(self.dataset_path)
        else:
            self.df = pd.DataFrame()

    def get_system_analytics(self, db: Optional[Session] = None) -> Dict[str, Any]:
        """Calculates system-wide agricultural analytics from the verified dataset and live predictions."""
        if self.df.empty:
            self._load_dataset()

        df = self.df.copy()

        # Incorporate live predictions from DB if available
        if db:
            db_preds = db.query(Prediction).all()
            if db_preds:
                pred_dicts = []
                for p in db_preds:
                    pred_dicts.append({
                        "State": p.state,
                        "Crop": p.crop,
                        "Soil_Type": p.soil_type,
                        "Fertilizer": p.fertilizer,
                        "N": p.n,
                        "P": p.p,
                        "K": p.k,
                        "Rainfall_mm": p.rainfall_mm,
                        "Temperature_C": p.temperature_c,
                        "Yield_kg_per_acre": p.predicted_yield_kg,
                        "Soil_pH": p.soil_ph,
                        "Year": p.year
                    })
                pred_df = pd.DataFrame(pred_dicts)
                df = pd.concat([df, pred_df], ignore_index=True)

        total_records = len(df)
        yield_col = "Yield_kg_per_acre" if "Yield_kg_per_acre" in df.columns else df.columns[9]
        yields = df[yield_col].astype(float)

        avg_yield = round(float(yields.mean()), 2)
        max_yield = round(float(yields.max()), 2)
        min_yield = round(float(yields.min()), 2)

        # Productivity Category Breakdown
        high_count = int((yields >= 3000).sum())
        mod_count = int(((yields >= 1500) & (yields < 3000)).sum())
        low_count = int((yields < 1500).sum())
        productivity_breakdown = {
            "High Yield (≥ 3000 kg/ac)": high_count,
            "Moderate Yield (1500 - 3000 kg/ac)": mod_count,
            "Low Yield (< 1500 kg/ac)": low_count
        }

        # Crop Productivity Analysis
        crop_stats = []
        if "Crop" in df.columns:
            for crop_name, group in df.groupby("Crop"):
                c_yields = group[yield_col].astype(float)
                c_avg = round(float(c_yields.mean()), 2)
                rating = "High" if c_avg >= 2800 else ("Moderate" if c_avg >= 1600 else "Low")
                crop_stats.append({
                    "crop_name": str(crop_name),
                    "record_count": int(len(group)),
                    "avg_yield_kg_per_acre": c_avg,
                    "min_yield_kg_per_acre": round(float(c_yields.min()), 2),
                    "max_yield_kg_per_acre": round(float(c_yields.max()), 2),
                    "productivity_rating": rating
                })
            crop_stats.sort(key=lambda x: x["avg_yield_kg_per_acre"], reverse=True)

        # Soil Analytics
        soil_stats = []
        if "Soil_Type" in df.columns:
            for s_type, group in df.groupby("Soil_Type"):
                s_yields = group[yield_col].astype(float)
                soil_stats.append({
                    "soil_type": str(s_type),
                    "count": int(len(group)),
                    "avg_yield_kg_per_acre": round(float(s_yields.mean()), 2),
                    "avg_ph": round(float(group["Soil_pH"].mean()), 2) if "Soil_pH" in group.columns else 6.5,
                    "avg_nitrogen": round(float(group["N"].mean()), 1) if "N" in group.columns else 75.0,
                    "avg_phosphorus": round(float(group["P"].mean()), 1) if "P" in group.columns else 50.0,
                    "avg_potassium": round(float(group["K"].mean()), 1) if "K" in group.columns else 100.0,
                })
            soil_stats.sort(key=lambda x: x["avg_yield_kg_per_acre"], reverse=True)

        # Weather Analytics
        weather_stats = []
        if "Rainfall_mm" in df.columns:
            rain_low = df[df["Rainfall_mm"] < 120]
            rain_mod = df[(df["Rainfall_mm"] >= 120) & (df["Rainfall_mm"] <= 220)]
            rain_high = df[df["Rainfall_mm"] > 220]

            weather_stats = [
                {
                    "rainfall_category": "Low (< 120mm)",
                    "avg_yield_kg_per_acre": round(float(rain_low[yield_col].mean()), 2) if len(rain_low) > 0 else 0.0,
                    "count": int(len(rain_low))
                },
                {
                    "rainfall_category": "Moderate (120 - 220mm)",
                    "avg_yield_kg_per_acre": round(float(rain_mod[yield_col].mean()), 2) if len(rain_mod) > 0 else 0.0,
                    "count": int(len(rain_mod))
                },
                {
                    "rainfall_category": "High (> 220mm)",
                    "avg_yield_kg_per_acre": round(float(rain_high[yield_col].mean()), 2) if len(rain_high) > 0 else 0.0,
                    "count": int(len(rain_high))
                }
            ]

        # Yield Distribution Histogram Buckets
        bins = [0, 1000, 2000, 3000, 4000, 100000]
        labels = ["< 1000 kg/ac", "1000-2000 kg/ac", "2000-3000 kg/ac", "3000-4000 kg/ac", "> 4000 kg/ac"]
        dist_counts = pd.cut(yields, bins=bins, labels=labels).value_counts()
        yield_distribution = []
        for label in labels:
            cnt = int(dist_counts.get(label, 0))
            pct = round((cnt / total_records) * 100, 1) if total_records > 0 else 0.0
            yield_distribution.append({
                "label": label,
                "count": cnt,
                "percentage": pct
            })

        # Key Agricultural Insights
        key_insights = [
            f"Average baseline agricultural yield across {total_records} analyzed records is {avg_yield:,.1f} kg/acre ({avg_yield/1000:.2f} tons/acre).",
            f"Soil pH between 6.0 and 7.2 yields the highest stability, mitigating nutrient lockout.",
            f"Moderate rainfall regimes (120-220 mm) produce optimal root moisture for staple crops without waterlogging.",
            f"Top performing crops by average yield in this agro-climatic profile: {', '.join([c['crop_name'] for c in crop_stats[:3]])}."
        ]

        system_recommendations = [
            "Maintain soil pH in the 6.2–6.8 sweet spot using agricultural lime or gypsum where soil is acidic or sodic.",
            "Implement split application of Nitrogen (50% basal, 25% vegetative, 25% flowering) to prevent leaching losses.",
            "Utilize drip irrigation and mulching during dry spells when seasonal rainfall is below 120 mm.",
            "Practice crop rotation with nitrogen-fixing legumes (Pulses/Soybean) to preserve soil organic carbon."
        ]

        return {
            "total_records_analyzed": total_records,
            "avg_yield_kg_per_acre": avg_yield,
            "max_yield_kg_per_acre": max_yield,
            "min_yield_kg_per_acre": min_yield,
            "productivity_breakdown": productivity_breakdown,
            "crop_productivity": crop_stats,
            "soil_analytics": soil_stats,
            "weather_analytics": weather_stats,
            "yield_distribution": yield_distribution,
            "key_insights": key_insights,
            "system_recommendations": system_recommendations
        }

    def get_farmer_analytics(self, user_id: int, db: Session) -> Dict[str, Any]:
        """Calculates individualized analytics and crop performance for a specific farmer."""
        farms = db.query(Farm).filter(Farm.user_id == user_id).all()
        crops = db.query(Crop).join(Farm).filter(Farm.user_id == user_id).all()
        predictions = db.query(Prediction).filter(Prediction.user_id == user_id).order_by(Prediction.created_at.desc()).all()

        total_farms = len(farms)
        total_crops = len(crops)
        total_predictions = len(predictions)

        if total_predictions > 0:
            pred_yields = [p.predicted_yield_kg for p in predictions]
            avg_pred = round(float(np.mean(pred_yields)), 2)
            max_pred = round(float(np.max(pred_yields)), 2)
            min_pred = round(float(np.min(pred_yields)), 2)

            high_count = sum(1 for y in pred_yields if y >= 3000)
            mod_count = sum(1 for y in pred_yields if 1500 <= y < 3000)
            low_count = sum(1 for y in pred_yields if y < 1500)
            productivity_summary = {
                "High Yield": high_count,
                "Moderate Yield": mod_count,
                "Low Yield": low_count
            }
        else:
            avg_pred = 0.0
            max_pred = 0.0
            min_pred = 0.0
            productivity_summary = {"High Yield": 0, "Moderate Yield": 0, "Low Yield": 0}

        # Tailored insights
        tailored_insights = []
        tailored_recommendations = []

        if total_predictions > 0:
            latest = predictions[0]
            tailored_insights.append(
                f"Your latest forecast for {latest.crop} on {latest.soil_type} soil is {latest.predicted_yield_kg:,.1f} kg/acre ({latest.productivity_category or 'Standard'})."
            )
            if latest.soil_ph < 6.0:
                tailored_insights.append(f"Soil pH for your recent {latest.crop} plot ({latest.soil_ph:.2f}) is moderately acidic.")
                tailored_recommendations.append("Apply agricultural lime (calcium carbonate) at 500–800 kg/acre to neutralize acidity and unlock Phosphorus availability.")
            elif latest.soil_ph > 7.5:
                tailored_insights.append(f"Soil pH for your recent {latest.crop} plot ({latest.soil_ph:.2f}) is slightly alkaline.")
                tailored_recommendations.append("Incorporate organic compost or gypsum to buffer alkaline soil pH and boost micronutrient intake.")

            if latest.rainfall_mm < 100:
                tailored_recommendations.append("Low rainfall forecast detected (< 100mm). Supplement with scheduled furrow or drip irrigation.")
            elif latest.rainfall_mm > 250:
                tailored_recommendations.append("High rainfall expected (> 250mm). Ensure adequate field drainage channels to avoid root rot.")
        else:
            tailored_insights.append("No forecasts generated yet. Run your first Yield Prediction to unlock personalized farm intelligence.")
            tailored_recommendations.append("Log your farms and crops in the management tab, then use the Predict Yield tool to evaluate potential harvest.")

        if total_farms > 0:
            farm_names = [f.farm_name for f in farms[:3]]
            tailored_insights.append(f"Managing {total_farms} farm field(s): {', '.join(farm_names)} covering total area of {sum(f.area for f in farms):.1f} acres.")

        if not tailored_recommendations:
            tailored_recommendations.append("Maintain standard balanced N-P-K nutrient schedules and monitor seasonal soil moisture.")

        return {
            "farmer_id": user_id,
            "total_farms": total_farms,
            "total_crops": total_crops,
            "total_predictions": total_predictions,
            "avg_predicted_yield_kg": avg_pred,
            "highest_predicted_yield_kg": max_pred,
            "lowest_predicted_yield_kg": min_pred,
            "productivity_summary": productivity_summary,
            "recent_predictions": predictions[:10],
            "farms_summary": farms,
            "crops_summary": crops,
            "tailored_insights": tailored_insights,
            "tailored_recommendations": tailored_recommendations
        }

    def analyze_risks_and_insights(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates input agricultural parameters (Crop, Soil, Nutrients, Weather, pH)
        to identify risk factors, strengths, and actionable agronomic recommendations.
        """
        crop = str(data.get("Crop", "Wheat"))
        soil = str(data.get("Soil_Type", "Loamy"))
        fertilizer = str(data.get("Fertilizer", "DAP"))
        n = float(data.get("N", 60.0))
        p = float(data.get("P", 40.0))
        k = float(data.get("K", 60.0))
        rain = float(data.get("Rainfall_mm", 150.0))
        temp = float(data.get("Temperature_C", 28.0))
        ph = float(data.get("Soil_pH", 6.5))

        risk_factors: List[Dict[str, str]] = []
        strengths: List[str] = []
        recommendations: List[str] = []
        risk_score = 0.0

        # 1. Soil pH Risk Analysis
        if ph < 5.5:
            risk_score += 30.0
            risk_factors.append({
                "category": "Soil pH",
                "severity": "Critical",
                "title": f"High Acidity Warning (pH {ph:.2f})",
                "description": "Strongly acidic soil causes severe Phosphorus fixation and Aluminum toxicity.",
                "impact_on_yield": "May reduce potential yield by 20% to 35%."
            })
            recommendations.append("Apply agricultural lime (1 to 1.5 tons/acre) 3 weeks before sowing to elevate soil pH above 6.2.")
        elif ph < 6.2:
            risk_score += 15.0
            risk_factors.append({
                "category": "Soil pH",
                "severity": "Warning",
                "title": f"Slight Acidity (pH {ph:.2f})",
                "description": "Mild acidity may restrict secondary nutrient absorption (Calcium, Magnesium).",
                "impact_on_yield": "Moderate yield limitation (~10%)."
            })
            recommendations.append("Incorporate compost or dolomitic limestone to gently buffer soil acidity.")
        elif ph > 8.0:
            risk_score += 25.0
            risk_factors.append({
                "category": "Soil pH",
                "severity": "Critical",
                "title": f"High Alkalinity Hazard (pH {ph:.2f})",
                "description": "Alkaline/saline soil induces Zinc, Iron, and Manganese micronutrient deficiencies.",
                "impact_on_yield": "Can cause chlorosis and stunt crop development by 15-30%."
            })
            recommendations.append("Apply agricultural gypsum (500 kg/acre) and organic matter to lower alkalinity and improve soil porosity.")
        elif ph > 7.5:
            risk_score += 10.0
            risk_factors.append({
                "category": "Soil pH",
                "severity": "Warning",
                "title": f"Mild Alkalinity (pH {ph:.2f})",
                "description": "Slightly high pH. Monitor for micro-nutrient availability.",
                "impact_on_yield": "Minor yield drag (~5%)."
            })
            recommendations.append("Use ammonium-based fertilizers (e.g. Ammonium Sulphate) to slightly acidify rhizosphere.")
        else:
            strengths.append(f"Optimal soil pH ({ph:.2f}) provides peak nutrient bioavailability for {crop}.")

        # 2. Moisture & Rainfall Risk Analysis
        water_intensive_crops = ["Rice", "Sugarcane", "Tea", "Jute"]
        drought_hardy_crops = ["Groundnut", "Barley", "Pulses", "Cotton"]

        if crop in water_intensive_crops and rain < 150.0:
            risk_score += 30.0
            risk_factors.append({
                "category": "Rainfall",
                "severity": "Critical",
                "title": f"Moisture Deficit for {crop} ({rain:.0f} mm)",
                "description": f"{crop} is a water-intensive crop requiring higher rainfall or heavy irrigation support.",
                "impact_on_yield": "Severe yield loss (up to 40%) without supplementary irrigation."
            })
            recommendations.append(f"Ensure supplemental drip/sprinkler irrigation of at least 150-200mm equivalent across vegetative stages of {crop}.")
        elif crop in drought_hardy_crops and rain > 280.0:
            risk_score += 25.0
            risk_factors.append({
                "category": "Rainfall",
                "severity": "Warning",
                "title": f"Excess Rainfall Risk ({rain:.0f} mm)",
                "description": f"Excess water can trigger root asphyxiation, fungal blight, or pod rotting in {crop}.",
                "impact_on_yield": "May increase disease incidence and reduce yield by 15-25%."
            })
            recommendations.append("Create raised planting beds and ensure drainage ditches are cleared to evacuate standing water.")
        elif 120.0 <= rain <= 240.0:
            strengths.append(f"Rainfall of {rain:.0f} mm provides balanced vegetative moisture without soil saturation.")
        elif rain < 80.0:
            risk_score += 20.0
            risk_factors.append({
                "category": "Rainfall",
                "severity": "Warning",
                "title": f"Low Precipitation ({rain:.0f} mm)",
                "description": "Low rainfall requires proactive conservation tillage and moisture retention.",
                "impact_on_yield": "May cause moisture stress during flowering."
            })
            recommendations.append("Apply organic mulch (straw/leaves) to retain soil moisture and reduce evapotranspiration.")

        # 3. Temperature Stress
        if crop in ["Wheat", "Barley"] and temp > 32.0:
            risk_score += 25.0
            risk_factors.append({
                "category": "Temperature",
                "severity": "Critical",
                "title": f"Terminal Heat Stress ({temp:.1f}°C)",
                "description": f"Temperatures above 32°C during grain-filling accelerate maturity and shrink grain size in {crop}.",
                "impact_on_yield": "Can reduce grain test weight and yield by 20-30%."
            })
            recommendations.append("Practice early sowing (mid-November) or select heat-tolerant varieties; apply light irrigation during grain fill.")
        elif temp > 38.0:
            risk_score += 15.0
            risk_factors.append({
                "category": "Temperature",
                "severity": "Warning",
                "title": f"High Ambient Heat ({temp:.1f}°C)",
                "description": "High temperature accelerates soil moisture depletion and pollen drying.",
                "impact_on_yield": "May lower pollination success."
            })
            recommendations.append("Maintain shade covers for nursery crops or irrigate in early mornings / late evenings.")
        elif 20.0 <= temp <= 32.0:
            strengths.append(f"Temperature regime ({temp:.1f}°C) is favorable for photosynthesis and vegetative development.")

        # 4. Nutrient Balance (N-P-K)
        if n < 30.0:
            risk_score += 15.0
            risk_factors.append({
                "category": "Nutrient Balance",
                "severity": "Warning",
                "title": f"Nitrogen Deficiency ({n:.1f} kg/ha)",
                "description": "Insufficient nitrogen stunts vegetative growth and lowers chlorophyll content.",
                "impact_on_yield": "Low canopy cover and reduced yield."
            })
            recommendations.append("Top-dress with Urea or apply Organic compost to lift available soil Nitrogen.")
        elif n > 130.0 and (p < 30.0 or k < 40.0):
            risk_score += 20.0
            risk_factors.append({
                "category": "Nutrient Balance",
                "severity": "Warning",
                "title": f"NPK Imbalance (N: {n:.0f}, P: {p:.0f}, K: {k:.0f})",
                "description": "Excess Nitrogen without proportional P and K causes lodging (falling over) and pest susceptibility.",
                "impact_on_yield": "Weak crop stems and lodging losses."
            })
            recommendations.append("Balance Nitrogen with Muriate of Potash (MOP) and DAP to fortify stalk strength.")
        else:
            strengths.append(f"Balanced nutrient profile (N:{n:.0f}, P:{p:.0f}, K:{k:.0f}) supports steady vegetative and reproductive growth.")

        # 5. Soil Type Compatibility
        if soil == "Sandy" and fertilizer == "Urea" and rain > 180:
            risk_score += 10.0
            risk_factors.append({
                "category": "Fertilizer",
                "severity": "Warning",
                "title": "Leaching Hazard in Sandy Soil",
                "description": "Urea washes down quickly through coarse sandy soil with heavy rain.",
                "impact_on_yield": "Nutrient wastage."
            })
            recommendations.append("Apply Urea in 3-4 small split doses or use Neem-coated slow release urea.")
        elif soil in ["Loamy", "Black"]:
            strengths.append(f"{soil} soil offers high cation-exchange capacity and water-holding capacity.")

        # Aggregate Risk Level
        risk_score = min(100.0, max(0.0, round(risk_score, 1)))
        if risk_score >= 50.0:
            overall_risk = "High Risk"
            forecast = "Stressed / Low Productivity"
            advisory = f"Significant agro-climatic stress detected for {crop}. Prioritize soil pH correction and irrigation adjustments immediately."
        elif risk_score >= 25.0:
            overall_risk = "Moderate Risk"
            forecast = "Moderate Productivity"
            advisory = f"Moderate growth conditions for {crop}. Mitigate specific nutrient or water warnings to achieve optimal yield."
        else:
            overall_risk = "Low Risk"
            forecast = "Optimal Productivity"
            advisory = f"Favorable agro-climatic conditions for {crop}. Continue standard good agronomic practices for maximum harvest potential."

        if not recommendations:
            recommendations.append(f"Maintain routine scouting and balanced fertilizer management for {crop}.")

        return {
            "overall_risk_level": overall_risk,
            "risk_score_percent": risk_score,
            "productivity_forecast": forecast,
            "risk_factors": risk_factors,
            "strengths": strengths,
            "actionable_recommendations": recommendations,
            "agronomic_advisory": advisory
        }
