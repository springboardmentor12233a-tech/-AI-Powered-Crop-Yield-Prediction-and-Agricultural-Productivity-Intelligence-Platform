from fastapi import APIRouter, Response, HTTPException
from pydantic import BaseModel
from typing import Optional
import csv
import io

router = APIRouter(prefix="/api/reports", tags=["reports"])

class ReportExportRequest(BaseModel):
    format: str = "csv"  # csv or json
    crop_type: Optional[str] = None
    region: Optional[str] = None

@router.post("/export")
def export_summary_report(req: ReportExportRequest):
    """
    Exports filterable summary reports in CSV or JSON format
    """
    records = [
        {"Farm ID": "FARM0001", "Region": "North India", "Crop": "Wheat", "Soil pH": 6.5, "Rainfall (mm)": 180.5, "Yield (kg/ha)": 4320, "NDVI": 0.62, "Risk": "Low"},
        {"Farm ID": "FARM0002", "Region": "South India", "Crop": "Rice", "Soil pH": 6.1, "Rainfall (mm)": 210.0, "Yield (kg/ha)": 4510, "NDVI": 0.71, "Risk": "Low"},
        {"Farm ID": "FARM0003", "Region": "Central USA", "Crop": "Maize", "Soil pH": 6.8, "Rainfall (mm)": 165.2, "Yield (kg/ha)": 4410, "NDVI": 0.65, "Risk": "Low"},
        {"Farm ID": "FARM0004", "Region": "South USA", "Crop": "Cotton", "Soil pH": 7.2, "Rainfall (mm)": 125.0, "Yield (kg/ha)": 4180, "NDVI": 0.52, "Risk": "Medium"},
        {"Farm ID": "FARM0005", "Region": "East Africa", "Crop": "Soybean", "Soil pH": 6.4, "Rainfall (mm)": 155.0, "Yield (kg/ha)": 4090, "NDVI": 0.58, "Risk": "Low"},
    ]

    # Filter
    if req.crop_type:
        records = [r for r in records if r["Crop"].lower() == req.crop_type.lower()]
    if req.region:
        records = [r for r in records if r["Region"].lower() == req.region.lower()]

    if req.format.lower() == "csv":
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=list(records[0].keys()) if records else ["Status"])
        writer.writeheader()
        writer.writerows(records)
        csv_content = output.getvalue()
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=YieldSense_AI_Summary_Report.csv"}
        )
    
    return {
        "status": "success",
        "format": "json",
        "total_records": len(records),
        "data": records
    }
