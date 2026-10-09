"""
YieldSense AI — Prediction History (Feature 3)
POST /history/save   — Save a prediction (called automatically from /predict)
GET  /history        — Get current user's prediction history (newest first)
GET  /history/{id}   — Get a specific prediction record
DELETE /history/{id} — Delete a specific prediction record
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import sys, os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.database import get_db, PredictionHistory, User
from auth_utils import get_current_user

router = APIRouter(prefix="/history", tags=["Prediction History"])


def _row_to_dict(row: PredictionHistory) -> dict:
    return {
        "id":                          row.id,
        "user_id":                     row.user_id,
        "created_at":                  row.created_at.isoformat(),
        "crop":                        row.crop,
        "region":                      row.region,
        "rainfall_mm":                 row.rainfall_mm,
        "temperature_c":               row.temperature_c,
        "weather_condition":           row.weather_condition,
        "soil_type":                   row.soil_type,
        "soil_ph":                     row.soil_ph,
        "nitrogen":                    row.nitrogen,
        "phosphorus":                  row.phosphorus,
        "potassium":                   row.potassium,
        "fertilizer_used":             row.fertilizer_used,
        "irrigation_used":             row.irrigation_used,
        "predicted_yield_kg_per_acre": row.predicted_yield_kg_per_acre,
        "model_used":                  row.model_used,
        "prediction_confidence":       row.prediction_confidence,
    }


@router.post("/save", status_code=201)
def save_prediction(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save a prediction result to history. Called after every successful prediction."""
    try:
        record = PredictionHistory(
            user_id                     = current_user.id,
            crop                        = payload["crop"],
            region                      = payload["region"],
            rainfall_mm                 = payload["rainfall_mm"],
            temperature_c               = payload["temperature_c"],
            weather_condition           = payload["weather_condition"],
            soil_type                   = payload["soil_type"],
            soil_ph                     = payload["soil_ph"],
            nitrogen                    = payload["nitrogen"],
            phosphorus                  = payload["phosphorus"],
            potassium                   = payload["potassium"],
            fertilizer_used             = payload["fertilizer_used"],
            irrigation_used             = payload["irrigation_used"],
            predicted_yield_kg_per_acre = payload["predicted_yield_kg_per_acre"],
            model_used                  = payload["model_used"],
            prediction_confidence       = payload.get("prediction_confidence", "high"),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return {"id": record.id, "message": "Prediction saved to history."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save prediction: {str(e)}")


@router.get("")
def get_history(
    crop: Optional[str] = Query(None, description="Filter by crop name"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the authenticated user's prediction history, newest first."""
    try:
        q = db.query(PredictionHistory).filter(PredictionHistory.user_id == current_user.id)
        if crop:
            q = q.filter(PredictionHistory.crop.ilike(f"%{crop}%"))
        total = q.count()
        rows  = q.order_by(PredictionHistory.created_at.desc()).offset(offset).limit(limit).all()
        return {
            "total":       total,
            "offset":      offset,
            "limit":       limit,
            "predictions": [_row_to_dict(r) for r in rows],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve history: {str(e)}")


@router.get("/{prediction_id}")
def get_prediction(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get details of a single historical prediction (only the owner can access it)."""
    row = db.query(PredictionHistory).filter(
        PredictionHistory.id == prediction_id,
        PredictionHistory.user_id == current_user.id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Prediction not found or access denied.")
    return _row_to_dict(row)


@router.delete("/{prediction_id}")
def delete_prediction(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a historical prediction record (only the owner can delete it)."""
    row = db.query(PredictionHistory).filter(
        PredictionHistory.id == prediction_id,
        PredictionHistory.user_id == current_user.id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Prediction not found or access denied.")
    db.delete(row)
    db.commit()
    return {"message": f"Prediction #{prediction_id} deleted."}
