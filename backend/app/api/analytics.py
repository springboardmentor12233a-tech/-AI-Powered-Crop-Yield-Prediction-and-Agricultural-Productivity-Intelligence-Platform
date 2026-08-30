import os
import json
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/analytics", tags=["EDA Analytics"])

METRICS_PATH = os.path.join("datasets", "processed", "eda_summary_metrics.json")

@router.get("/metrics")
def get_eda_metrics():
    if not os.path.exists(METRICS_PATH):
        raise HTTPException(status_code=404, detail="EDA metrics file not generated yet")
    with open(METRICS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

@router.get("/plots")
def list_eda_plots():
    plots_dir = "eda_plots"
    if not os.path.exists(plots_dir):
        return {"plots": []}
    files = [f for f in os.listdir(plots_dir) if f.endswith(".png")]
    return {"plots": files, "base_url": "/eda_plots/"}
