"""
YieldSense AI — PDF Report Generation (Feature 1)
GET /report/{prediction_id}  — Download a PDF report for a saved prediction
POST /report/generate        — Generate a PDF for an unsaved (live) prediction result
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime
import io, sys, os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.database import get_db, PredictionHistory, User
from auth_utils import get_current_user

router = APIRouter(prefix="/report", tags=["PDF Report"])


def _build_pdf(data: dict) -> bytes:
    """Build and return a PDF report as raw bytes using ReportLab."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    )

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2.2*cm, bottomMargin=2.2*cm,
        title="YieldSense AI — Crop Yield Prediction Report",
    )

    styles = getSampleStyleSheet()
    GREEN  = colors.HexColor("#2d7d46")
    DARK   = colors.HexColor("#111827")
    GRAY   = colors.HexColor("#6b7280")
    LGRAY  = colors.HexColor("#f3f4f6")

    h1 = ParagraphStyle("h1", parent=styles["Heading1"],
                         fontSize=20, textColor=GREEN, spaceAfter=4)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"],
                         fontSize=13, textColor=DARK, spaceBefore=14, spaceAfter=6)
    body = ParagraphStyle("body", parent=styles["Normal"],
                           fontSize=10, textColor=DARK, leading=14)
    muted = ParagraphStyle("muted", parent=styles["Normal"],
                            fontSize=9, textColor=GRAY, leading=12)
    disclaimer = ParagraphStyle("disclaimer", parent=styles["Normal"],
                                 fontSize=8, textColor=GRAY, leading=11,
                                 backColor=LGRAY, borderPadding=6)

    def table(rows, col_widths=None):
        t = Table(rows, colWidths=col_widths or [7*cm, 10*cm])
        t.setStyle(TableStyle([
            ("BACKGROUND",  (0, 0), (-1, 0), GREEN),
            ("TEXTCOLOR",   (0, 0), (-1, 0), colors.white),
            ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",    (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LGRAY]),
            ("GRID",        (0, 0), (-1, -1), 0.4, colors.HexColor("#d1d5db")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING",    (0, 0), (-1, -1), 6),
            ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ]))
        return t

    # ─── Page number footer ────────────────────────────────────────────────────
    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(GRAY)
        canvas.drawCentredString(A4[0]/2, 1.2*cm,
                                  f"YieldSense AI  •  Page {doc.page}")
        canvas.restoreState()

    # ─── Build content ─────────────────────────────────────────────────────────
    story = []

    # Header
    story.append(Paragraph("YieldSense AI", h1))
    story.append(Paragraph("Crop Yield Prediction Report", ParagraphStyle(
        "sub", parent=styles["Normal"], fontSize=12, textColor=GRAY, spaceAfter=4)))
    story.append(Paragraph(
        f"Generated: {data.get('generated_at', datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC'))}",
        muted))
    if data.get("prediction_date"):
        story.append(Paragraph(f"Prediction date: {data['prediction_date']}", muted))
    story.append(HRFlowable(width="100%", thickness=1, color=GREEN, spaceAfter=10))

    # Prediction result banner
    story.append(Paragraph("Predicted Crop Yield", h2))
    result_rows = [
        ["Parameter",            "Value"],
        ["Predicted Yield",      f"{data['predicted_yield_kg_per_acre']} kg/acre"],
        ["ML Model Used",        data.get("model_used", "N/A")],
        ["Confidence",           data.get("prediction_confidence", "N/A").title()],
        ["Crop",                 data.get("crop", "N/A")],
        ["Region",               data.get("region", "N/A")],
    ]
    story.append(table(result_rows))
    story.append(Spacer(1, 12))

    # Weather parameters
    story.append(Paragraph("Weather Parameters", h2))
    weather_rows = [
        ["Parameter",          "Value"],
        ["Rainfall",           f"{data.get('rainfall_mm', 'N/A')} mm"],
        ["Temperature",        f"{data.get('temperature_c', 'N/A')} °C"],
        ["Weather Condition",  data.get("weather_condition", "N/A")],
    ]
    story.append(table(weather_rows))
    story.append(Spacer(1, 12))

    # Soil parameters
    story.append(Paragraph("Soil Parameters", h2))
    soil_rows = [
        ["Parameter",    "Value"],
        ["Soil Type",    data.get("soil_type", "N/A")],
        ["Soil pH",      str(data.get("soil_ph", "N/A"))],
        ["Nitrogen",     f"{data.get('nitrogen', 'N/A')} kg/ha"],
        ["Phosphorus",   f"{data.get('phosphorus', 'N/A')} kg/ha"],
        ["Potassium",    f"{data.get('potassium', 'N/A')} kg/ha"],
    ]
    story.append(table(soil_rows))
    story.append(Spacer(1, 12))

    # Agricultural inputs
    story.append(Paragraph("Agricultural Inputs", h2))
    input_rows = [
        ["Input",          "Value"],
        ["Fertilizer Used", "Yes" if data.get("fertilizer_used") else "No"],
        ["Irrigation Used", "Yes" if data.get("irrigation_used") else "No"],
    ]
    story.append(table(input_rows))
    story.append(Spacer(1, 12))

    # AI Insights (if available)
    if data.get("ai_insights"):
        story.append(Paragraph("AI Agricultural Insights", h2))
        story.append(Paragraph(data["ai_insights"].replace("\n", "<br/>"), body))
        story.append(Spacer(1, 10))

    # Disclaimer
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#d1d5db"), spaceBefore=10))
    story.append(Paragraph(
        "Disclaimer: The yield prediction is generated by a machine learning model trained on a "
        "programmatically generated dataset. Results are for informational purposes only. "
        "Always verify with local agricultural experts before making farming decisions. "
        "AI insights (if included) are generated by an LLM and do not modify the ML prediction.",
        disclaimer,
    ))

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    return buf.getvalue()


@router.get("/{prediction_id}")
def download_report_by_id(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download a PDF report for a saved prediction. Only the owner can download it."""
    row = db.query(PredictionHistory).filter(
        PredictionHistory.id == prediction_id,
        PredictionHistory.user_id == current_user.id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Prediction not found or access denied.")

    data = {
        "generated_at":                datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        "prediction_date":             row.created_at.strftime("%Y-%m-%d %H:%M UTC"),
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

    pdf_bytes = _build_pdf(data)
    filename = f"YieldSense_Report_{row.crop}_{row.created_at.strftime('%Y%m%d_%H%M')}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/generate")
def generate_live_report(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    """
    Generate a PDF report for a live (unsaved) prediction result.
    Called from the Predict page after prediction, before navigating away.
    Optionally includes AI insights if passed in the payload.
    """
    if "predicted_yield_kg_per_acre" not in payload:
        raise HTTPException(status_code=400, detail="predicted_yield_kg_per_acre is required.")

    data = {
        "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        **payload,
    }

    pdf_bytes = _build_pdf(data)
    crop = payload.get("crop", "Crop")
    filename = f"YieldSense_Report_{crop}_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
