from io import BytesIO
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak
)


# ============================================================
# YieldSense AI PDF Report Generator
# ============================================================

def create_pdf_report(report_data):
    """
    Generate a professional YieldSense AI agricultural report.

    Parameters
    ----------
    report_data : dict
        Data collected from the prediction, weather, soil,
        risk and recommendation modules.

    Returns
    -------
    BytesIO
        PDF file stored in memory.
    """

    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title="YieldSense AI Agricultural Report",
        author="YieldSense AI"
    )

    styles = getSampleStyleSheet()

    # --------------------------------------------------------
    # Styles
    # --------------------------------------------------------

    title_style = ParagraphStyle(
        "YieldSenseTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#172033"),
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        "YieldSenseSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#64748B"),
        spaceAfter=14
    )

    section_style = ParagraphStyle(
        "YieldSenseSection",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#172033"),
        spaceBefore=8,
        spaceAfter=8
    )

    body_style = ParagraphStyle(
        "YieldSenseBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#374151")
    )

    label_style = ParagraphStyle(
        "YieldSenseLabel",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#64748B")
    )

    value_style = ParagraphStyle(
        "YieldSenseValue",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#172033")
    )

    big_value_style = ParagraphStyle(
        "YieldSenseBigValue",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=19,
        leading=23,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#172033")
    )

    footer_style = ParagraphStyle(
        "YieldSenseFooter",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#94A3B8")
    )

    # --------------------------------------------------------
    # Helper functions
    # --------------------------------------------------------

    def safe_value(value, default="Not available"):
        if value is None or value == "":
            return default
        return str(value)

    def make_info_table(rows):
        table_data = []

        for label, value in rows:
            table_data.append([
                Paragraph(
                    safe_value(label),
                    label_style
                ),
                Paragraph(
                    safe_value(value),
                    body_style
                )
            ])

        table = Table(
            table_data,
            colWidths=[
                52 * mm,
                116 * mm
            ]
        )

        table.setStyle(
            TableStyle([
                (
                    "BACKGROUND",
                    (0, 0),
                    (0, -1),
                    colors.HexColor("#F8FAFC")
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor("#E2E8F0")
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE"
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    8
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    8
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7
                )
            ])
        )

        return table

    def make_card(title, value):

        card = Table(
            [[
                Paragraph(
                    title,
                    label_style
                )
            ], [
                Paragraph(
                    safe_value(value),
                    big_value_style
                )]],
            colWidths=[81 * mm]
        )

        card.setStyle(
            TableStyle([
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    colors.HexColor("#F8FAFC")
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.7,
                    colors.HexColor("#E2E8F0")
                ),
                (
                    "ALIGN",
                    (0, 0),
                    (-1, -1),
                    "CENTER"
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE"
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    8
                )
            ])
        )

        return card

    def make_risk_box(level, reasons):

        level = safe_value(
            level,
            "Not available"
        )

        if level.lower() == "high":

            background = colors.HexColor("#FEE2E2")
            border = colors.HexColor("#EF4444")
            text = colors.HexColor("#991B1B")

        elif level.lower() == "moderate":

            background = colors.HexColor("#FEF3C7")
            border = colors.HexColor("#F59E0B")
            text = colors.HexColor("#92400E")

        else:

            background = colors.HexColor("#DCFCE7")
            border = colors.HexColor("#22C55E")
            text = colors.HexColor("#166534")

        if not reasons:
            reasons = [
                "No major risk indicators were identified."
            ]

        reason_html = "<br/>".join(
            f"• {safe_value(reason)}"
            for reason in reasons
        )

        risk_title = ParagraphStyle(
            "RiskTitle",
            parent=body_style,
            fontName="Helvetica-Bold",
            fontSize=13,
            textColor=text
        )

        risk_body = ParagraphStyle(
            "RiskBody",
            parent=body_style,
            textColor=text
        )

        content = [
            Paragraph(
                f"Risk Level: {level}",
                risk_title
            ),
            Spacer(1, 4),
            Paragraph(
                reason_html,
                risk_body
            )
        ]

        table = Table(
            [[content]],
            colWidths=[168 * mm]
        )

        table.setStyle(
            TableStyle([
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    background
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.8,
                    border
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    10
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    10
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    9
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    9
                )
            ])
        )

        return table

    # --------------------------------------------------------
    # Extract report information
    # --------------------------------------------------------

    crop = report_data.get("crop")
    state = report_data.get("state")
    season = report_data.get("season")

    predicted_yield = report_data.get(
        "predicted_yield"
    )

    area = report_data.get("area")
    fertilizer = report_data.get("fertilizer")
    pesticide = report_data.get("pesticide")

    temperature = report_data.get(
        "avg_temp_c"
    )

    rainfall = report_data.get(
        "total_rainfall_mm"
    )

    humidity = report_data.get(
        "avg_humidity_percent"
    )

    historical_rainfall = report_data.get(
        "avg_historical_rainfall_mm"
    )

    historical_temperature = report_data.get(
        "avg_historical_temp_c"
    )

    rainfall_comparison = report_data.get(
        "rainfall_vs_history"
    )

    soil_info = report_data.get(
        "soil_info",
        {}
    )

    risk_info = report_data.get(
        "risk",
        {}
    )

    risk_level = risk_info.get(
        "level",
        "Not available"
    )

    risk_reasons = risk_info.get(
        "reasons",
        []
    )

    recommendation = report_data.get(
        "recommendation"
    )

    if not recommendation:
        recommendation = (
            "Use the prediction, weather conditions and "
            "soil indicators together when planning "
            "crop management activities."
        )

    # --------------------------------------------------------
    # Document content
    # --------------------------------------------------------

    story = []

    # --------------------------------------------------------
    # Header
    # --------------------------------------------------------

    story.append(
        Paragraph(
            "YieldSense AI",
            title_style
        )
    )

    story.append(
        Paragraph(
            "Agricultural Intelligence & Crop Yield Report",
            subtitle_style
        )
    )

    header = Table(
        [[
            Paragraph(
                "AGRICULTURAL ANALYSIS REPORT",
                ParagraphStyle(
                    "Header",
                    parent=body_style,
                    fontName="Helvetica-Bold",
                    fontSize=10,
                    alignment=TA_CENTER,
                    textColor=colors.white
                )
            )
        ]],
        colWidths=[168 * mm]
    )

    header.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, -1),
                colors.HexColor("#172033")
            ),
            (
                "BOX",
                (0, 0),
                (-1, -1),
                0.5,
                colors.HexColor("#172033")
            ),
            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                8
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                8
            )
        ])
    )

    story.append(header)
    story.append(Spacer(1, 10))

    # --------------------------------------------------------
    # Main prediction cards
    # --------------------------------------------------------

    prediction_value = (
        f"{float(predicted_yield):.3f} tonnes/hectare"
        if predicted_yield is not None
        else "Not available"
    )

    cards = Table(
        [[
            make_card(
                "PREDICTED YIELD",
                prediction_value
            ),
            make_card(
                "RISK LEVEL",
                risk_level
            )
        ]],
        colWidths=[
            84 * mm,
            84 * mm
        ]
    )

    cards.setStyle(
        TableStyle([
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "TOP"
            ),
            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                0
            ),
            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                4
            )
        ])
    )

    story.append(cards)
    story.append(Spacer(1, 12))

    # --------------------------------------------------------
    # Crop information
    # --------------------------------------------------------

    story.append(
        Paragraph(
            "Crop & Farm Information",
            section_style
        )
    )

    story.append(
        make_info_table([
            ("Crop", crop),
            ("State", state),
            ("Season", season),
            ("Area", f"{safe_value(area)} hectares"),
            ("Fertilizer", fertilizer),
            ("Pesticide", pesticide)
        ])
    )

    story.append(Spacer(1, 12))

    # --------------------------------------------------------
    # Weather analysis
    # --------------------------------------------------------

    story.append(
        Paragraph(
            "Weather Analysis",
            section_style
        )
    )

    story.append(
        make_info_table([
            (
                "Temperature",
                f"{safe_value(temperature)} °C"
            ),
            (
                "Rainfall",
                f"{safe_value(rainfall)} mm"
            ),
            (
                "Humidity",
                f"{safe_value(humidity)} %"
            ),
            (
                "Historical Avg. Rainfall",
                f"{safe_value(historical_rainfall)} mm"
            ),
            (
                "Historical Avg. Temperature",
                f"{safe_value(historical_temperature)} °C"
            ),
            (
                "Rainfall Compared With History",
                rainfall_comparison
            )
        ])
    )

    story.append(Spacer(1, 12))

    # --------------------------------------------------------
    # Soil analysis
    # --------------------------------------------------------

    story.append(
        Paragraph(
            "Soil Analysis",
            section_style
        )
    )

    soil_rows = []

    if isinstance(soil_info, dict):

        for key, value in soil_info.items():

            display_key = (
                str(key)
                .replace("_", " ")
                .title()
            )

            if isinstance(value, float):
                value = round(value, 2)

            soil_rows.append(
                (
                    display_key,
                    value
                )
            )

    if not soil_rows:

        soil_rows.append(
            (
                "Soil Information",
                "No soil data available"
            )
        )

    story.append(
        make_info_table(
            soil_rows
        )
    )

    story.append(Spacer(1, 12))

    # --------------------------------------------------------
    # Risk assessment
    # --------------------------------------------------------

    story.append(
        Paragraph(
            "Agricultural Risk Assessment",
            section_style
        )
    )

    story.append(
        make_risk_box(
            risk_level,
            risk_reasons
        )
    )

    story.append(Spacer(1, 12))

    # --------------------------------------------------------
    # Recommendation
    # --------------------------------------------------------

    story.append(
        Paragraph(
            "Agricultural Recommendation",
            section_style
        )
    )

    recommendation_box = Table(
        [[
            Paragraph(
                safe_value(recommendation),
                body_style
            )
        ]],
        colWidths=[168 * mm]
    )

    recommendation_box.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, -1),
                colors.HexColor("#F8FAFC")
            ),
            (
                "BOX",
                (0, 0),
                (-1, -1),
                0.7,
                colors.HexColor("#CBD5E1")
            ),
            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                10
            ),
            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                10
            ),
            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                10
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                10
            )
        ])
    )

    story.append(
        recommendation_box
    )

    story.append(Spacer(1, 12))

    # --------------------------------------------------------
    # Overall summary
    # --------------------------------------------------------

    story.append(
        Paragraph(
            "Overall Summary",
            section_style
        )
    )

    summary = (
        f"YieldSense AI estimates a predicted yield of "
        f"<b>{prediction_value}</b> for "
        f"<b>{safe_value(crop)}</b> in "
        f"<b>{safe_value(state)}</b> during the "
        f"<b>{safe_value(season)}</b> season. "
        f"The current agricultural assessment indicates a "
        f"<b>{safe_value(risk_level)}</b> risk level based "
        f"on the available weather, soil and prediction "
        f"indicators."
    )

    story.append(
        Paragraph(
            summary,
            body_style
        )
    )

    story.append(Spacer(1, 18))

    # --------------------------------------------------------
    # Report metadata
    # --------------------------------------------------------

    generated_time = datetime.now().strftime(
        "%d %B %Y, %I:%M %p"
    )

    metadata = Table(
        [[
            Paragraph(
                f"Generated: {generated_time}",
                footer_style
            ),
            Paragraph(
                "YieldSense AI",
                footer_style
            )
        ]],
        colWidths=[
            118 * mm,
            50 * mm
        ]
    )

    metadata.setStyle(
        TableStyle([
            (
                "LINEABOVE",
                (0, 0),
                (-1, 0),
                0.5,
                colors.HexColor("#CBD5E1")
            ),
            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                7
            ),
            (
                "ALIGN",
                (1, 0),
                (1, 0),
                "RIGHT"
            )
        ])
    )

    story.append(metadata)

    # --------------------------------------------------------
    # Footer
    # --------------------------------------------------------

    def add_page_footer(canvas, doc):

        canvas.saveState()

        canvas.setFont(
            "Helvetica",
            7
        )

        canvas.setFillColor(
            colors.HexColor("#94A3B8")
        )

        canvas.drawString(
            18 * mm,
            9 * mm,
            "YieldSense AI • Agricultural Intelligence Platform"
        )

        canvas.drawRightString(
            A4[0] - 18 * mm,
            9 * mm,
            f"Page {doc.page}"
        )

        canvas.restoreState()

    # --------------------------------------------------------
    # Build document
    # --------------------------------------------------------

    document.build(
        story,
        onFirstPage=add_page_footer,
        onLaterPages=add_page_footer
    )

    buffer.seek(0)

    return buffer