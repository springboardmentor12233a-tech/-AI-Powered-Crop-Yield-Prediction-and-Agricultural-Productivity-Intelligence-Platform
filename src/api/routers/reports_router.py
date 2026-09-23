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
from src.analytics.prediction_report import build_prediction_report
from src.analytics.risk_assessment import assess_agricultural_risks
from src.analytics.llm_provider import generate_agricultural_llm_report
from src.analytics.pdf_utils import sanitize_for_reportlab
from src.ml.models.registry import predict_crop_yield, predict_crop_recommendation

# ReportLab imports for generating real A4 PDFs
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

router = APIRouter(prefix="/api/reports", tags=["Reports & PDF Generation"])

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

@router.post("/generate")
def generate_interactive_report(req: CreateReportRequest, user_id: Optional[int] = Depends(get_current_user_id)):
    """
    Generates an end-to-end Agricultural Productivity & Seasonal Intelligence Report:
    - Runs in-memory ML yield regression & crop suitability classification
    - Evaluates agricultural risk categories (Low/Moderate/High)
    - Generates LLM explanations or deterministic fallback
    - Persists report to database when authenticated
    """
    input_dict = req.model_dump()
    predicted_yield = predict_crop_yield(input_dict)
    
    rec_input = {
        "Temperature": req.Temperature_C,
        "Humidity": req.Humidity_pct,
        "pH": req.Soil_pH,
        "Rainfall": req.Rainfall_mm
    }
    try:
        recommendations = predict_crop_recommendation(rec_input, top_k=3)
    except Exception:
        recommendations = []
        
    risk_assessment = assess_agricultural_risks(
        crop=req.Crop,
        soil_ph=req.Soil_pH,
        soil_type=req.Soil_Type,
        rainfall_mm=req.Rainfall_mm,
        temperature_c=req.Temperature_C,
        humidity_pct=req.Humidity_pct,
        fertilizer_kg=req.Fertilizer_Used_kg,
        pesticides_kg=req.Pesticides_Used_kg,
        irrigation=req.Irrigation,
        previous_crop=req.Previous_Crop,
        predicted_yield=predicted_yield
    )
    
    llm_report = generate_agricultural_llm_report(
        crop=req.Crop,
        region=req.Region,
        soil_type=req.Soil_Type,
        soil_ph=req.Soil_pH,
        rainfall_mm=req.Rainfall_mm,
        temperature_c=req.Temperature_C,
        humidity_pct=req.Humidity_pct,
        fertilizer_kg=req.Fertilizer_Used_kg,
        pesticides_kg=req.Pesticides_Used_kg,
        irrigation=req.Irrigation,
        previous_crop=req.Previous_Crop,
        predicted_yield=predicted_yield,
        risk_data=risk_assessment
    )
    
    # Base structured report
    report_dict = build_prediction_report(
        farm_id="FARM-01",
        plot_label=req.field_name or "North Field",
        crop=req.Crop,
        region=req.Region,
        soil_type=req.Soil_Type,
        soil_ph=req.Soil_pH,
        rainfall_mm=req.Rainfall_mm,
        temperature_c=req.Temperature_C,
        humidity_pct=req.Humidity_pct,
        fertilizer_kg=req.Fertilizer_Used_kg,
        pesticides_kg=req.Pesticides_Used_kg,
        planting_density=req.Planting_Density,
        irrigation=req.Irrigation,
        previous_crop=req.Previous_Crop,
        predicted_yield=predicted_yield,
        recommended_crops=recommendations
    )
    report_dict["risk_assessment"] = risk_assessment
    report_dict["llm_insights"] = llm_report
    
    report_id = f"RPT-{uuid.uuid4().hex[:8].upper()}"
    report_dict["report_id"] = report_id
    
    if user_id:
        try:
            save_user_prediction(
                user_id=user_id,
                report_id=report_id,
                payload=input_dict,
                predicted_yield=predicted_yield,
                insights=report_dict
            )
        except Exception as e:
            print(f"Error saving user report: {e}")
            
    return report_dict

@router.get("/{report_id}/pdf")
def download_report_pdf(report_id: str, user_id: Optional[int] = Depends(get_current_user_id)):
    """
    Generates and returns an authentic, publication-quality A4 PDF report document
    with header, farmer metadata, prediction results, risk evaluation, and AI insights.
    """
    record = None
    farmer = None
    farm = None
    
    if user_id:
        record = get_prediction_by_report_id(user_id, report_id)
        farmer = get_user_by_id(user_id)
        farm = get_user_farm(user_id)
        
    if not record:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found for authenticated farmer.")
        
    pdf_buffer = generate_pdf_buffer(record, farmer, farm)
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=YieldSense_Report_{report_id}.pdf"
        }
    )

def generate_pdf_buffer(record: dict, farmer: Optional[dict], farm: Optional[dict]) -> io.BytesIO:
    """Generates ReportLab A4 PDF document containing all report data."""
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
    
    # Custom Palette Colors
    PRIMARY_COLOR = colors.HexColor("#1e3a8a")  # Deep Navy
    SECONDARY_COLOR = colors.HexColor("#047857")  # Forest Green
    TEXT_DARK = colors.HexColor("#1f2937")
    BG_LIGHT = colors.HexColor("#f8fafc")
    BORDER_COLOR = colors.HexColor("#cbd5e1")
    ALERT_BG = colors.HexColor("#fef3c7")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=PRIMARY_COLOR,
        alignment=TA_LEFT
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#475569")
    )
    
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=SECONDARY_COLOR,
        spaceBefore=10,
        spaceAfter=4
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=TEXT_DARK
    )
    
    bold_body = ParagraphStyle(
        'BoldBody',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    elements = []
    
    # 1. Header & Branding Banner
    header_data = [
        [
            Paragraph("<b>YieldSense AI</b><br/><font size=8 color='#475569'>Agricultural Productivity & Seasonal Intelligence Platform</font>", title_style),
            Paragraph(f"<b>Report ID:</b> {record.get('report_id')}<br/><b>Date:</b> {record.get('created_at', datetime.utcnow().strftime('%Y-%m-%d'))}", ParagraphStyle('RightMeta', parent=subtitle_style, alignment=TA_RIGHT))
        ]
    ]
    header_table = Table(header_data, colWidths=[320, 200])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(header_table)
    elements.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_COLOR, spaceBefore=4, spaceAfter=8))
    
    # 2. Farmer & Plot Summary
    farmer_name = farmer.get("full_name", "Registered Farmer") if farmer else "Farmer Profile"
    location = f"{farmer.get('village', '')}, {farmer.get('district', '')}, {farmer.get('state', '')}".strip(" ,") if farmer else "Field Location"
    field_name = record.get("field_name") or (farm.get("field_name") if farm else "Main Plot")
    land_area = f"{farm.get('land_size', 4.5)} {farm.get('land_unit', 'Acres')}" if farm else "4.5 Acres"
    
    profile_data = [
        [Paragraph("<b>Farmer Name:</b>", body_style), Paragraph(sanitize_for_reportlab(farmer_name), body_style), Paragraph("<b>Field / Plot:</b>", body_style), Paragraph(sanitize_for_reportlab(field_name), body_style)],
        [Paragraph("<b>Location:</b>", body_style), Paragraph(sanitize_for_reportlab(location or "Registered Zone"), body_style), Paragraph("<b>Land Area:</b>", body_style), Paragraph(sanitize_for_reportlab(land_area), body_style)],
    ]
    profile_table = Table(profile_data, colWidths=[90, 170, 90, 170])
    profile_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(profile_table)
    elements.append(Spacer(1, 8))
    
    # 3. Forecast Result Banner
    pred_yield = record.get("predicted_yield", 0.0)
    crop_name = record.get("crop", "Target Crop")
    
    result_data = [
        [
            Paragraph(f"<font size=11 color='#047857'><b>ML FORECASTED CROP YIELD</b></font><br/><font size=18 color='#1e3a8a'><b>{pred_yield:.2f} ton/ha</b></font><br/><font size=8 color='#64748b'>Target Crop: <b>{sanitize_for_reportlab(crop_name)}</b></font>", ParagraphStyle('YieldBox', alignment=TA_CENTER, leading=16)),
            Paragraph(f"<b>Key Management Summary</b><br/>• Irrigation: {record.get('irrigation')}<br/>• Fertilizer: {record.get('fertilizer_kg', 0):.0f} kg/ha<br/>• Pesticides: {record.get('pesticides_kg', 0):.0f} kg/ha<br/>• Rotation: Prev. {record.get('previous_crop')}", body_style)
        ]
    ]
    result_table = Table(result_data, colWidths=[240, 280])
    result_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor("#ecfdf5")),
        ('BACKGROUND', (1, 0), (1, 0), BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(result_table)
    elements.append(Spacer(1, 8))
    
    # 4. Environmental & Soil Input Parameters Table
    elements.append(Paragraph("<b>Input Environmental & Agronomic Parameters</b>", section_heading))
    inputs_data = [
        [Paragraph("<b>Parameter</b>", bold_body), Paragraph("<b>Input Value</b>", bold_body), Paragraph("<b>Parameter</b>", bold_body), Paragraph("<b>Input Value</b>", bold_body)],
        [Paragraph("Region", body_style), Paragraph(str(record.get("region")), body_style), Paragraph("Soil pH", body_style), Paragraph(f"{record.get('soil_ph', 0):.2f}", body_style)],
        [Paragraph("Soil Texture", body_style), Paragraph(str(record.get("soil_type")), body_style), Paragraph("Rainfall (mm)", body_style), Paragraph(f"{record.get('rainfall_mm', 0):.1f} mm", body_style)],
        [Paragraph("Temperature (°C)", body_style), Paragraph(f"{record.get('temperature_c', 0):.1f} °C", body_style), Paragraph("Humidity (%)", body_style), Paragraph(f"{record.get('humidity_pct', 0):.1f} %", body_style)],
        [Paragraph("Planting Density", body_style), Paragraph(f"{record.get('planting_density', 0):.1f} plants/m²", body_style), Paragraph("Previous Crop", body_style), Paragraph(str(record.get("previous_crop")), body_style)],
    ]
    inputs_table = Table(inputs_data, colWidths=[130, 130, 130, 130])
    inputs_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(inputs_table)
    elements.append(Spacer(1, 8))
    
    # 5. Risk Assessment Section
    insights = record.get("insights", {})
    risk_info = insights.get("risk_assessment") or assess_agricultural_risks(
        crop=crop_name,
        soil_ph=record.get("soil_ph", 6.5),
        soil_type=record.get("soil_type", "Loam"),
        rainfall_mm=record.get("rainfall_mm", 600),
        temperature_c=record.get("temperature_c", 25),
        humidity_pct=record.get("humidity_pct", 60),
        fertilizer_kg=record.get("fertilizer_kg", 150),
        pesticides_kg=record.get("pesticides_kg", 20),
        irrigation=record.get("irrigation", "Sprinkler"),
        previous_crop=record.get("previous_crop", "None"),
        predicted_yield=pred_yield
    )
    
    elements.append(Paragraph("<b>Agricultural Risk Assessment</b>", section_heading))
    risk_banner = [
        [
            Paragraph(f"<b>Overall Risk Rating: {risk_info.get('overall_risk', 'Moderate').upper()}</b><br/>{sanitize_for_reportlab(risk_info.get('summary', ''))}", body_style)
        ]
    ]
    risk_table = Table(risk_banner, colWidths=[520])
    risk_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), ALERT_BG if risk_info.get('overall_risk') == 'Moderate' else colors.HexColor("#fee2e2") if risk_info.get('overall_risk') == 'High' else colors.HexColor("#dcfce7")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#f59e0b") if risk_info.get('overall_risk') == 'Moderate' else colors.HexColor("#ef4444") if risk_info.get('overall_risk') == 'High' else colors.HexColor("#10b981")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(risk_table)
    elements.append(Spacer(1, 6))
    
    # 6. AI Agronomic Explanation & Actionable Guidance
    elements.append(Paragraph("<b>Agronomic Analysis & Recommendations</b>", section_heading))
    llm_info = insights.get("llm_insights") or {}
    report_content = llm_info.get("content") or "Maintain balanced fertilization, monitor soil moisture during vegetative stages, and execute preventative scouting for optimal crop productivity."
    
    # Format markdown lines into readable paragraphs
    for line in report_content.split("\n"):
        line = line.strip()
        if not line:
            continue
        if line.startswith("###"):
            clean_head = sanitize_for_reportlab(line.replace("###", "").strip())
            elements.append(Paragraph(f"<b>{clean_head}</b>", section_heading))
        elif line.startswith("-") or line.startswith("•"):
            clean_text = sanitize_for_reportlab(line.lstrip("-•* ").strip())
            elements.append(Paragraph(f"• {clean_text}", body_style))
        elif line.startswith("1.") or line.startswith("2.") or line.startswith("3."):
            clean_text = sanitize_for_reportlab(line.strip())
            elements.append(Paragraph(f"{clean_text}", body_style))
        else:
            clean_text = sanitize_for_reportlab(line.strip())
            elements.append(Paragraph(clean_text, body_style))
        elements.append(Spacer(1, 2))
        
    # 7. Disclaimer
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceBefore=4, spaceAfter=4))
    disclaimer_text = (
        "<b>Notice & Decision Support Disclaimer:</b> This report is generated by YieldSense AI utilizing machine learning regression "
        "and data-driven agronomic intelligence. Predictions and suggestions serve as decision-support guidance. "
        "Actual crop performance is subject to unpredictable weather fluctuations, local pest outbreaks, and field management practices."
    )
    elements.append(Paragraph(disclaimer_text, ParagraphStyle('Disclaimer', parent=body_style, fontSize=7, leading=9, textColor=colors.HexColor("#64748b"))))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer
