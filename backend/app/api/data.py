import os
import pandas as pd
from typing import Optional
from fastapi import APIRouter, Query, HTTPException

router = APIRouter(prefix="/api/data", tags=["Dataset Operations"])

DATASET_PATH = os.path.join("datasets", "processed", "cleaned_crop_yield.csv")

def load_data() -> pd.DataFrame:
    path = DATASET_PATH if os.path.exists(DATASET_PATH) else "Smart_Farming_Crop_Yield_2024.csv"
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Dataset file not found")
    df = pd.read_csv(path)
    return df

@router.get("/records")
def get_crop_records(
    crop_type: Optional[str] = Query(None, description="Filter by Crop Type"),
    region: Optional[str] = Query(None, description="Filter by Region"),
    search: Optional[str] = Query(None, description="Global text search"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    df = load_data()

    if crop_type:
        df = df[df["crop_type"].str.lower() == crop_type.lower()]
    if region:
        df = df[df["region"].str.lower() == region.lower()]
    if search:
        search_lower = search.lower()
        mask = df.astype(str).apply(lambda row: row.str.lower().str.contains(search_lower).any(), axis=1)
        df = df[mask]

    total_records = len(df)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated_df = df.iloc[start_idx:end_idx].fillna("")

    return {
        "total_records": total_records,
        "page": page,
        "limit": limit,
        "total_pages": (total_records + limit - 1) // limit,
        "data": paginated_df.to_dict(orient="records")
    }

@router.get("/summary")
def get_dataset_summary():
    df = load_data()
    return {
        "total_farms": len(df),
        "avg_yield_kg_ha": round(float(df["yield_kg_per_hectare"].mean()), 2),
        "avg_rainfall_mm": round(float(df["rainfall_mm"].mean()), 2),
        "avg_ndvi": round(float(df["NDVI_index"].mean()), 2),
        "total_regions": int(df["region"].nunique()),
        "crops_supported": list(df["crop_type"].unique())
    }
