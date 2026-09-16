import io
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException, Depends, Response
from pydantic import BaseModel, Field

from src.api.routers.auth import get_current_user_id
from src.db.database import (
    save_user_prediction,
    get_user_prediction_history,
    get_prediction_by_report_id,
    get_user_by_id,
    get_user_farm
)
from src.analytics.prediction_report import build_prediction_report, format_markdown_report
from src.ml.models.registry import predict_crop_yield, predict_crop_recommendation

# ReportLab imports for generating real A4 PDFs
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

router = APIRouter(prefix="/api/reports", tags=["Reports & History"])

class CreateReportRequest(BaseModel):
    Crop: str = Field(..., description="Crop variety")
    Region: str = Field(..., description="Region A, B, C, D")
    Soil_Type: str = Field(..., description="Sandy, Loam, Clay")
    Soil_pH: float = Field(..., ge=0.0, le=14.0)
    Rainfall_mm: float = Field(..., ge=0.0, le=10000.0)
    Temperature_C: float = Field(..., ge=-50.0, le=60.0)
    Humidity_pct: float = Field(..., ge=0.0, le=100.0)
    Fertilizer_Used_kg: float = Field(..., ge=0.0, le=2000.0)
    Irrigation: str = Field(...)
    Pesticides_Used_kg: float = Field(..., ge=0.0, le=500.0)
    Planting_Density: float = Field(..., ge=0.0, le=200.0)
    Previous_Crop: str = Field(...)
    field_name: Optional[str] = Field("North Field", description="Optional Field / Plot Name")

@router.get("/history")
def get_prediction_history(user_id: Optional[int] = Depends(get_current_user_id)):
    """Returns saved prediction reports owned strictly by the authenticated farmer."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")
    history = get_user_prediction_history(user_id)
    return {"history": history, "status": "Success"}

@router.get("/{report_id}")
def get_report_by_id(report_id: str, user_id: Optional[int] = Depends(get_current_user_id)):
    """Fetches a specific prediction report verifying farmer ownership."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")
    record = get_prediction_by_report_id(user_id, report_id)
    if not record:
        raise HTTPException(status_code=404, detail="Report not found or access denied.")
    return {"report": record, "status": "Success"}

def build_pdf_document(report: dict, farmer_name: str) -> bytes:
    """
    Generates a professional, print-ready A4 PDF document using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Palette
    PRIMARY_GREEN = colors.HexColor("#166534")  # Deep forest green
    SECONDARY_GREEN = colors.HexColor("#15803d")
    TEXT_DARK = colors.HexColor("#1e293b")
    BG_LIGHT = colors.HexColor("#f8fafc")
    BORDER_COLOR = colors.HexColor("#cbd5e1")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=PRIMARY_GREEN,
        fontName="Helvetica-Bold",
        alignment=TA_LEFT
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#475569"),
        fontName="Helvetica"
    )
    
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=PRIMARY_GREEN,
        fontName="Helvetica-Bold",
        spaceBefore=10,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=TEXT_DARK,
        fontName="Helvetica"
    )
    
    story = []
    
    # Header Branding
    story.append(Paragraph("YieldSense AI", title_style))
    story.append(Paragraph("AI-Based Crop Yield Prediction & Agricultural Recommendation Platform", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_GREEN, spaceBefore=0, spaceAfter=12))
    
    # Report Metadata Table
    report_id = report.get("report_id", "RPT-LOCAL")
    created_at = report.get("created_at", datetime.now().strftime("%Y-%m-%d"))
    field_name = report.get("field_name") or report.get("plot_label") or "Main Field"
    crop = report.get("crop") or report.get("Crop", "Wheat")
    region = report.get("region") or report.get("Region", "Region_A")
    yield_val = report.get("predicted_yield", 0.0)
    
    meta_data = [
        [Paragraph("<b>Report ID:</b>", body_style), Paragraph(report_id, body_style), Paragraph("<b>Date:</b>", body_style), Paragraph(str(created_at)[:10], body_style)],
        [Paragraph("<b>Farmer:</b>", body_style), Paragraph(farmer_name, body_style), Paragraph("<b>Field / Plot Name:</b>", body_style), Paragraph(field_name, body_style)],
        [Paragraph("<b>Target Crop:</b>", body_style), Paragraph(crop, body_style), Paragraph("<b>Region:</b>", body_style), Paragraph(region, body_style)]
    ]
    
    meta_table = Table(meta_data, colWidths=[90, 160, 110, 160])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))
    
    # Forecast Summary Box
    story.append(Paragraph("1. Forecasted Harvest Yield", section_heading))
    yield_text = f"<font size=18 color='#166534'><b>{yield_val:.2f} ton/ha</b></font>"
    desc_text = f"Estimated yield for <b>{crop}</b> based on the specified soil, climatic, and farm management parameters."
    
    yield_box_data = [[
        Paragraph(yield_text, ParagraphStyle('YieldBig', parent=body_style, alignment=TA_CENTER)),
        Paragraph(desc_text, body_style)
    ]]
    yield_box_table = Table(yield_box_data, colWidths=[180, 340])
    yield_box_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdf4")),
        ('BOX', (0,0), (-1,-1), 1, SECONDARY_GREEN),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(yield_box_table)
    story.append(Spacer(1, 14))
    
    # Field Conditions Table
    story.append(Paragraph("2. Field & Environmental Conditions", section_heading))
    
    soil_type = report.get("soil_type", "Loam")
    soil_ph = report.get("soil_ph", 6.8)
    temp = report.get("temperature_c", 22.0)
    humidity = report.get("humidity_pct", 60.0)
    rainfall = report.get("rainfall_mm", 650.0)
    fertilizer = report.get("fertilizer_kg", 180.0)
    irrigation = report.get("irrigation", "Sprinkler")
    pesticides = report.get("pesticides_kg", 20.0)
    density = report.get("planting_density", 15.0)
    prev_crop = report.get("previous_crop", "Maize")
    
    cond_data = [
        [Paragraph("<b>Parameter</b>", body_style), Paragraph("<b>Input Value</b>", body_style), Paragraph("<b>Parameter</b>", body_style), Paragraph("<b>Input Value</b>", body_style)],
        [Paragraph("Soil Texture", body_style), Paragraph(str(soil_type), body_style), Paragraph("Soil pH", body_style), Paragraph(f"{soil_ph:.2f}", body_style)],
        [Paragraph("Temperature", body_style), Paragraph(f"{temp:.1f} °C", body_style), Paragraph("Relative Humidity", body_style), Paragraph(f"{humidity:.1f} %", body_style)],
        [Paragraph("Precipitation (Rainfall)", body_style), Paragraph(f"{rainfall:.1f} mm", body_style), Paragraph("Fertilizer Application", body_style), Paragraph(f"{fertilizer:.1f} kg/cycle", body_style)],
        [Paragraph("Irrigation Method", body_style), Paragraph(str(irrigation), body_style), Paragraph("Pesticide Application", body_style), Paragraph(f"{pesticides:.1f} kg/cycle", body_style)],
        [Paragraph("Planting Density", body_style), Paragraph(f"{density:.1f} plants/m²", body_style), Paragraph("Previous Crop", body_style), Paragraph(str(prev_crop), body_style)],
    ]
    
    cond_table = Table(cond_data, colWidths=[130, 130, 130, 130])
    cond_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(cond_table)
    story.append(Spacer(1, 14))
    
    # Insights Section
    story.append(Paragraph("3. Agronomic Assessment & Insights", section_heading))
    insights = report.get("insights") or {}
    
    if isinstance(insights, dict):
        for layer_name in ["model_predictions", "data_driven_insights", "general_guidance"]:
            items = insights.get(layer_name, [])
            for item in items:
                title = item.get("title", "")
                desc = item.get("description", "")
                story.append(Paragraph(f"• <b>{title}:</b> {desc}", body_style))
                story.append(Spacer(1, 3))
                
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceBefore=4, spaceAfter=8))
    
    # Footer Notice
    footer_text = "<b>YieldSense AI</b> — This report is generated based on empirical machine learning models trained on agricultural datasets. Use as a decision-support guide alongside local extension recommendations."
    story.append(Paragraph(footer_text, ParagraphStyle('FooterNote', parent=body_style, fontSize=8, leading=11, textColor=colors.HexColor("#64748b"))))
    
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

@router.get("/pdf/{report_id}")
def download_report_pdf(report_id: str, user_id: Optional[int] = Depends(get_current_user_id)):
    """
    Generates and returns an actual downloadable A4 PDF document for a specific prediction report.
    Enforces user data authorization.
    """
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")
        
    prediction = get_prediction_by_report_id(user_id, report_id)
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction report not found or access denied.")
        
    user = get_user_by_id(user_id)
    farmer_name = user.get("full_name", "Farmer") if user else "Farmer"
    
    pdf_bytes = build_pdf_document(prediction, farmer_name)
    
    filename = f"YieldSense_AI_Crop_Yield_Report_{report_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
