import io
import csv
import random
from datetime import datetime
from typing import Dict, Any

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)

def build_report_data(
    farmer_name: str = "Registered Farmer",
    consultant_name: str = "Dr. Agronomist (CropCast Lead)",
    state: str = "Punjab",
    crop: str = "Wheat",
    season: str = "Rabi",
    area: float = 50.0,
    rainfall: float = 650.0,
    temperature: float = 22.0,
    fertilizer: float = 120.0,
    pesticide: float = 1.5,
    yield_per_hectare: float = 4.85,
    total_production: float = 242.5,
    confidence: float = 94.8,
    model_used: str = "XGBoost Regressor v2.4",
    risk_level: str = "Low",
    advisory: str = "Apply Nitrogen top-dressing at tillering stage and maintain scheduled micro-irrigation."
) -> Dict[str, Any]:
    """
    Generates structured Agricultural Report Data covering:
    1. Productivity scores (Tonnes/Ha)
    2. Seasonal yield comparisons (Rabi vs Kharif vs Zaid)
    3. Weather impact summaries
    4. Agronomic & Financial Advisory
    """
    report_id = f"AGR-REP-{random.randint(100000, 999999)}"
    timestamp = datetime.utcnow().strftime("%B %d, %Y - %H:%M UTC")

    # 1. Productivity Scores calculations
    total_prod = round(total_production or (yield_per_hectare * area), 2)
    commercial_val = round(total_prod * 280.0, 2) # Benchmark $280/ton for commercial grain
    productivity_score_index = min(100.0, round((yield_per_hectare / 4.2) * 85.0, 1))
    
    if yield_per_hectare >= 4.5:
        rating = "Optimal Productivity (Top 10% Regional Percentile)"
    elif yield_per_hectare >= 3.5:
        rating = "Standard Productivity (Average Benchmark)"
    else:
        rating = "Below Regional Benchmark (Optimization Recommended)"

    # 2. Seasonal Yield Comparisons (Rabi vs Kharif vs Zaid)
    rabi_yield = round(yield_per_hectare if season.lower() in ["rabi", "winter"] else yield_per_hectare * 1.12, 2)
    kharif_yield = round(yield_per_hectare * 0.86 if season.lower() in ["rabi", "winter"] else yield_per_hectare, 2)
    zaid_yield = round(yield_per_hectare * 0.68, 2)
    seasonal_diff_pct = round(((rabi_yield - kharif_yield) / kharif_yield) * 100.0, 1)

    # 3. Weather Impact Summaries
    gdd = int(temperature * 65.0) # Growing Degree Days approximation
    rain_baseline_diff = round(((rainfall - 600.0) / 600.0) * 100.0, 1)
    rain_status = f"{'+' if rain_baseline_diff >= 0 else ''}{rain_baseline_diff}% vs 10-yr Historical Mean"

    if rainfall < 400:
        weather_impact = "Severe Moisture Deficit Risk. Supplemental drip irrigation mandatory."
        vulnerability = "High Vulnerability (Drought Risk)"
    elif temperature > 32:
        weather_impact = "Heat Stress Alert. High evapotranspiration rate detected."
        vulnerability = "Moderate Vulnerability (Thermal Heat Stress)"
    else:
        weather_impact = "Optimal Climate Envelope. Precipitation and temperature ideal for grain filling."
        vulnerability = "Low Climate Vulnerability (Favorable Monsoon & Thermal Index)"

    return {
        "report_id": report_id,
        "timestamp": timestamp,
        "farmer_name": farmer_name,
        "consultant_name": consultant_name,
        "location": {
            "state": state,
            "crop": crop,
            "season": season,
            "area_hectares": area
        },
        "model_telemetry": {
            "model_used": model_used,
            "confidence_score": confidence,
            "fertilizer_kg_ha": fertilizer,
            "pesticide_kg_ha": pesticide
        },
        "productivity_scores": {
            "yield_per_hectare": yield_per_hectare,
            "total_production_tonnes": total_prod,
            "productivity_score_index": productivity_score_index,
            "rating": rating,
            "estimated_commercial_value_usd": commercial_val,
            "percentile_rank": "Top 12% in " + state
        },
        "seasonal_comparison": {
            "rabi_yield_tha": rabi_yield,
            "kharif_yield_tha": kharif_yield,
            "zaid_yield_tha": zaid_yield,
            "rabi_vs_kharif_variance_pct": f"+{seasonal_diff_pct}%" if seasonal_diff_pct > 0 else f"{seasonal_diff_pct}%",
            "optimal_sowing_window": "October 20 – November 15 (Rabi) | June 15 – July 10 (Kharif)",
            "crop_rotation_advice": "Rotate Wheat with Leguminous Pulses (Chickpea/Mungbean) in Zaid to replenish Nitrogen."
        },
        "weather_impact_summary": {
            "recorded_rainfall_mm": rainfall,
            "rainfall_status": rain_status,
            "avg_temperature_celsius": temperature,
            "gdd_index": gdd,
            "risk_level": risk_level,
            "vulnerability": vulnerability,
            "weather_impact_analysis": weather_impact
        },
        "advisory": advisory
    }


def generate_pdf_report_bytes(report_data: Dict[str, Any]) -> bytes:
    """
    Generates an official formatted PDF Agricultural Intelligence Report using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#10b981')
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748b')
    )

    section_heading = ParagraphStyle(
        'SecHead',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=12,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#1e293b')
    )

    elements = []

    # 1. Header Banner Table
    header_data = [
        [
            Paragraph("<b>CROPCAST AGTECH PLATFORM</b><br/><font size=8 color='#64748b'>AI-Powered Agricultural Yield & Intelligence System</font>", title_style),
            Paragraph(f"<b>REPORT ID:</b> {report_data['report_id']}<br/><b>DATE:</b> {report_data['timestamp']}", subtitle_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[360, 180])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#10b981'), spaceAfter=15))

    # 2. Metadata / Farm Profile Table
    loc = report_data['location']
    meta_table_data = [
        [
            Paragraph(f"<b>Farmer / Client:</b> {report_data['farmer_name']}", body_style),
            Paragraph(f"<b>Consultant:</b> {report_data['consultant_name']}", body_style)
        ],
        [
            Paragraph(f"<b>State / Region:</b> {loc['state']}", body_style),
            Paragraph(f"<b>Target Crop:</b> {loc['crop']} ({loc['season']} Season)", body_style)
        ],
        [
            Paragraph(f"<b>Farm Area:</b> {loc['area_hectares']} Hectares", body_style),
            Paragraph(f"<b>AI Engine:</b> {report_data['model_telemetry']['model_used']}", body_style)
        ]
    ]
    meta_table = Table(meta_table_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#f1f5f9')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 15))

    # 3. SECTION 1: PRODUCTIVITY SCORES (Tonnes/Ha)
    elements.append(Paragraph("1. FARM PRODUCTIVITY SCORES & FORECAST", section_heading))
    
    prod = report_data['productivity_scores']
    prod_table_data = [
        [
            Paragraph("Metric", ParagraphStyle('TH', parent=body_style, fontName='Helvetica-Bold', textColor=colors.white)),
            Paragraph("Forecast Value", ParagraphStyle('TH', parent=body_style, fontName='Helvetica-Bold', textColor=colors.white)),
            Paragraph("Benchmark & Assessment", ParagraphStyle('TH', parent=body_style, fontName='Helvetica-Bold', textColor=colors.white))
        ],
        [
            Paragraph("<b>Yield Per Hectare</b>", body_style),
            Paragraph(f"<font size=11 color='#10b981'><b>{prod['yield_per_hectare']} T/ha</b></font>", body_style),
            Paragraph(prod['rating'], body_style)
        ],
        [
            Paragraph("<b>Total Harvest Output</b>", body_style),
            Paragraph(f"<b>{prod['total_production_tonnes']} Tonnes</b>", body_style),
            Paragraph(f"Across {loc['area_hectares']} Hectares total farm area", body_style)
        ],
        [
            Paragraph("<b>Productivity Score Index</b>", body_style),
            Paragraph(f"<b>{prod['productivity_score_index']} / 100</b>", body_style),
            Paragraph(prod['percentile_rank'], body_style)
        ],
        [
            Paragraph("<b>Est. Commercial Value</b>", body_style),
            Paragraph(f"<b>${prod['estimated_commercial_value_usd']:,.2f} USD</b>", body_style),
            Paragraph("Based on $280/Ton market benchmark", body_style)
        ]
    ]
    prod_table = Table(prod_table_data, colWidths=[150, 140, 250])
    prod_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 7),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')])
    ]))
    elements.append(prod_table)
    elements.append(Spacer(1, 15))

    # 4. SECTION 2: SEASONAL YIELD COMPARISONS (Rabi vs Kharif)
    elements.append(Paragraph("2. SEASONAL YIELD COMPARISONS (Rabi vs Kharif vs Zaid)", section_heading))
    
    seas = report_data['seasonal_comparison']
    seas_table_data = [
        [
            Paragraph("Season", ParagraphStyle('TH', parent=body_style, fontName='Helvetica-Bold', textColor=colors.white)),
            Paragraph("Yield Potential", ParagraphStyle('TH', parent=body_style, fontName='Helvetica-Bold', textColor=colors.white)),
            Paragraph("Seasonal Variance & Sowing Window", ParagraphStyle('TH', parent=body_style, fontName='Helvetica-Bold', textColor=colors.white))
        ],
        [
            Paragraph("<b>Rabi (Winter)</b>", body_style),
            Paragraph(f"<b>{seas['rabi_yield_tha']} T/ha</b>", body_style),
            Paragraph(f"Optimal Winter Grain Period ({seas['rabi_vs_kharif_variance_pct']} vs Kharif)", body_style)
        ],
        [
            Paragraph("<b>Kharif (Monsoon)</b>", body_style),
            Paragraph(f"<b>{seas['kharif_yield_tha']} T/ha</b>", body_style),
            Paragraph("Monsoon Grain Period (High Rain Reliance)", body_style)
        ],
        [
            Paragraph("<b>Zaid (Spring)</b>", body_style),
            Paragraph(f"<b>{seas['zaid_yield_tha']} T/ha</b>", body_style),
            Paragraph("Intercrop Period (Short duration legumes / fodder)", body_style)
        ]
    ]
    seas_table = Table(seas_table_data, colWidths=[150, 140, 250])
    seas_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#06b6d4')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 7),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')])
    ]))
    elements.append(seas_table)
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(f"<b>Agronomic Sowing Window:</b> {seas['optimal_sowing_window']}", body_style))
    elements.append(Paragraph(f"<b>Crop Rotation Strategy:</b> {seas['crop_rotation_advice']}", body_style))
    elements.append(Spacer(1, 15))

    # 5. SECTION 3: WEATHER IMPACT SUMMARIES
    elements.append(Paragraph("3. WEATHER & AGRO-CLIMATIC IMPACT SUMMARY", section_heading))
    
    weath = report_data['weather_impact_summary']
    weath_table_data = [
        [
            Paragraph(f"<b>Recorded Monsoon Rainfall:</b> {weath['recorded_rainfall_mm']} mm", body_style),
            Paragraph(f"<b>Precipitation Status:</b> {weath['rainfall_status']}", body_style)
        ],
        [
            Paragraph(f"<b>Average Air Temperature:</b> {weath['avg_temperature_celsius']} °C", body_style),
            Paragraph(f"<b>Growing Degree Days (GDD):</b> {weath['gdd_index']} GDD", body_style)
        ],
        [
            Paragraph(f"<b>Climate Risk Score:</b> {weath['risk_level']}", body_style),
            Paragraph(f"<b>Vulnerability Rating:</b> {weath['vulnerability']}", body_style)
        ]
    ]
    weath_table = Table(weath_table_data, colWidths=[270, 270])
    weath_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 7),
    ]))
    elements.append(weath_table)
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(f"<b>Weather Impact Analysis:</b> {weath['weather_impact_analysis']}", body_style))
    elements.append(Spacer(1, 15))

    # 6. SECTION 4: AGRONOMIC ADVISORY & CONSULTANT SIGN-OFF
    elements.append(Paragraph("4. AI OPTIMIZATION & CONSULTANT ADVISORY", section_heading))
    elements.append(Paragraph(f"{report_data['advisory']}", body_style))
    elements.append(Spacer(1, 20))

    sign_table_data = [
        [
            Paragraph("<b>Prepared By:</b><br/>CropCast Precision AgTech Engine", body_style),
            Paragraph(f"<b>Verified By Consultant:</b><br/>{report_data['consultant_name']}", body_style),
            Paragraph("<b>Stamp / Digital Signature:</b><br/>[VERIFIED CROPCAST INTEL]", body_style)
        ]
    ]
    sign_table = Table(sign_table_data, colWidths=[180, 180, 180])
    sign_table.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,0), 1, colors.HexColor('#94a3b8')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(KeepTogether(sign_table))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()


def generate_csv_report_text(report_data: Dict[str, Any]) -> str:
    """
    Generates structured CSV content formatted for farmers, consultants, and data analysts.
    """
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["=================================================="])
    writer.writerow(["CROPCAST AGRICULTURAL INTELLIGENCE REPORT"])
    writer.writerow(["=================================================="])
    writer.writerow(["Report ID", report_data["report_id"]])
    writer.writerow(["Timestamp", report_data["timestamp"]])
    writer.writerow(["Farmer Name", report_data["farmer_name"]])
    writer.writerow(["Consultant Name", report_data["consultant_name"]])
    writer.writerow(["State / Region", report_data["location"]["state"]])
    writer.writerow(["Crop", report_data["location"]["crop"]])
    writer.writerow(["Season", report_data["location"]["season"]])
    writer.writerow(["Farm Area (Hectares)", report_data["location"]["area_hectares"]])
    writer.writerow([])

    writer.writerow(["--- PRODUCTIVITY SCORES (Tonnes/Ha) ---"])
    prod = report_data["productivity_scores"]
    writer.writerow(["Yield Per Hectare (Tonnes/Ha)", prod["yield_per_hectare"]])
    writer.writerow(["Total Harvest Production (Tonnes)", prod["total_production_tonnes"]])
    writer.writerow(["Productivity Score Index (0-100)", prod["productivity_score_index"]])
    writer.writerow(["Productivity Rating", prod["rating"]])
    writer.writerow(["Est Commercial Value (USD)", prod["estimated_commercial_value_usd"]])
    writer.writerow([])

    writer.writerow(["--- SEASONAL YIELD COMPARISONS (Rabi vs Kharif) ---"])
    seas = report_data["seasonal_comparison"]
    writer.writerow(["Rabi Yield Potential (T/ha)", seas["rabi_yield_tha"]])
    writer.writerow(["Kharif Yield Potential (T/ha)", seas["kharif_yield_tha"]])
    writer.writerow(["Zaid Yield Potential (T/ha)", seas["zaid_yield_tha"]])
    writer.writerow(["Rabi vs Kharif Variance", seas["rabi_vs_kharif_variance_pct"]])
    writer.writerow(["Optimal Sowing Window", seas["optimal_sowing_window"]])
    writer.writerow([])

    writer.writerow(["--- WEATHER IMPACT SUMMARY ---"])
    weath = report_data["weather_impact_summary"]
    writer.writerow(["Recorded Rainfall (mm)", weath["recorded_rainfall_mm"]])
    writer.writerow(["Rainfall Status", weath["rainfall_status"]])
    writer.writerow(["Avg Temperature (C)", weath["avg_temperature_celsius"]])
    writer.writerow(["Growing Degree Days (GDD)", weath["gdd_index"]])
    writer.writerow(["Climate Risk Level", weath["risk_level"]])
    writer.writerow(["Vulnerability Rating", weath["vulnerability"]])
    writer.writerow(["Weather Impact Analysis", weath["weather_impact_analysis"]])
    writer.writerow([])

    writer.writerow(["--- AGRONOMIC ADVISORY ---"])
    writer.writerow(["Advisory Recommendation", report_data["advisory"]])

    return output.getvalue()
