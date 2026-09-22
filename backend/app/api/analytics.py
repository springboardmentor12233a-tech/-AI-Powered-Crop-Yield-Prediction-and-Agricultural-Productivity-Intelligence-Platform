from fastapi import APIRouter, Query, HTTPException
from typing import Optional, Dict, Any, List

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/seasonal-trends")
def get_seasonal_trends(crop_type: Optional[str] = Query(None, description="Optional crop filter")):
    """
    Returns multi-year seasonal yield performance trends (2020 - 2024 historical + 2025 projection)
    """
    yearly_data = [
        {"year": 2020, "avg_yield_kg_ha": 3950, "rainfall_mm": 162.4, "temp_C": 23.8, "ndvi": 0.54},
        {"year": 2021, "avg_yield_kg_ha": 4120, "rainfall_mm": 174.1, "temp_C": 24.2, "ndvi": 0.58},
        {"year": 2022, "avg_yield_kg_ha": 4080, "rainfall_mm": 158.9, "temp_C": 25.1, "ndvi": 0.56},
        {"year": 2023, "avg_yield_kg_ha": 4290, "rainfall_mm": 182.5, "temp_C": 24.0, "ndvi": 0.61},
        {"year": 2024, "avg_yield_kg_ha": 4312, "rainfall_mm": 178.6, "temp_C": 24.5, "ndvi": 0.61},
        {"year": 2025, "avg_yield_kg_ha": 4480, "rainfall_mm": 185.0, "temp_C": 24.1, "ndvi": 0.64, "is_projection": True}
    ]

    crop_yield_averages = {
        "Rice": {"historical_avg": 4450, "trend_status": "Increasing (+4.2%)", "best_season": "Kharif / Monsoon"},
        "Maize": {"historical_avg": 4390, "trend_status": "Stable (+2.1%)", "best_season": "Spring / Summer"},
        "Cotton": {"historical_avg": 4320, "trend_status": "Optimal (+3.8%)", "best_season": "Late Spring"},
        "Wheat": {"historical_avg": 4280, "trend_status": "Increasing (+5.0%)", "best_season": "Rabi / Winter"},
        "Soybean": {"historical_avg": 4120, "trend_status": "Moderate (+1.5%)", "best_season": "Monsoon"}
    }

    if crop_type and crop_type in crop_yield_averages:
        selected_crop_stats = crop_yield_averages[crop_type]
    else:
        selected_crop_stats = {"historical_avg": 4312, "trend_status": "Overall Positive (+3.5%)", "best_season": "Multi-Season"}

    return {
        "status": "success",
        "crop_filter": crop_type or "All Crops",
        "yearly_trends": yearly_data,
        "crop_insights": selected_crop_stats,
        "data_source": "YieldSense AI Analytics Data Warehouse"
    }

@router.get("/farm-comparison")
def get_farm_comparison():
    """
    Returns side-by-side performance comparison across multiple farm sectors/zones
    """
    farms = [
        {
            "sector_id": "Sector A1",
            "name": "Iowa North Parcel",
            "hectares": 380,
            "crop_type": "Corn / Maize",
            "avg_yield_kg_ha": 4520,
            "soil_health_index": 0.78,
            "soil_pH": 6.6,
            "moisture_percent": 38.2,
            "risk_rating": "Low",
            "ndvi_index": 0.68
        },
        {
            "sector_id": "Sector B4",
            "name": "Iowa East Field",
            "hectares": 520,
            "crop_type": "Wheat",
            "avg_yield_kg_ha": 4380,
            "soil_health_index": 0.72,
            "soil_pH": 6.4,
            "moisture_percent": 34.5,
            "risk_rating": "Medium",
            "ndvi_index": 0.62
        },
        {
            "sector_id": "Sector C2",
            "name": "Central USA Delta",
            "hectares": 290,
            "crop_type": "Rice",
            "avg_yield_kg_ha": 4610,
            "soil_health_index": 0.81,
            "soil_pH": 6.2,
            "moisture_percent": 42.0,
            "risk_rating": "Low",
            "ndvi_index": 0.74
        },
        {
            "sector_id": "Sector D5",
            "name": "South USA Basin",
            "hectares": 410,
            "crop_type": "Cotton",
            "avg_yield_kg_ha": 4210,
            "soil_health_index": 0.65,
            "soil_pH": 7.1,
            "moisture_percent": 29.8,
            "risk_rating": "High",
            "ndvi_index": 0.54
        },
        {
            "sector_id": "Sector E3",
            "name": "East Africa Plateau",
            "hectares": 350,
            "crop_type": "Soybean",
            "avg_yield_kg_ha": 4190,
            "soil_health_index": 0.68,
            "soil_pH": 6.8,
            "moisture_percent": 32.1,
            "risk_rating": "Low",
            "ndvi_index": 0.59
        }
    ]

    return {
        "status": "success",
        "total_farms_compared": len(farms),
        "total_hectares_monitored": sum(int(f["hectares"]) for f in farms if isinstance(f["hectares"], (int, float))),
        "highest_yield_sector": "Sector C2 (4,610 kg/ha)",
        "farm_comparisons": farms
    }
