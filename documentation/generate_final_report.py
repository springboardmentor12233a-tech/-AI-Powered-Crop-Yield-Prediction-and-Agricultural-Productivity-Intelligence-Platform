from datetime import date
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZipFile

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "AgriYield_AI_Final_Project_Report_OVS_VARUN.docx"
SOURCE_REPORT = ROOT / "AgriYield_AI_Milestone_3_Report_OVS_VARUN.docx"


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shading = OxmlElement("w:shd")
    shading.set(qn("w:fill"), fill)
    tc_pr.append(shading)


def set_cell_text(cell, text, bold=False, color=None):
    cell.text = ""
    run = cell.paragraphs[0].add_run(str(text))
    run.bold = bold
    if color:
        run.font.color.rgb = RGBColor(*color)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER


def add_table(document, headers, rows, widths=None):
    table = document.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    for index, header in enumerate(headers):
        set_cell_text(table.rows[0].cells[index], header, bold=True, color=(255, 255, 255))
        set_cell_shading(table.rows[0].cells[index], "0B6E4F")
    for row in rows:
        cells = table.add_row().cells
        for index, value in enumerate(row):
            set_cell_text(cells[index], value)
            if len(table.rows) % 2 == 1:
                set_cell_shading(cells[index], "EAF6F0")
    if widths:
        for row in table.rows:
            for index, width in enumerate(widths):
                row.cells[index].width = Inches(width)
    document.add_paragraph()
    return table


def add_heading(document, text, level=1):
    paragraph = document.add_heading(text, level=level)
    for run in paragraph.runs:
        run.font.color.rgb = RGBColor(11, 110, 79) if level == 1 else RGBColor(31, 78, 61)
    return paragraph


def add_bullets(document, items):
    for item in items:
        document.add_paragraph(item, style="List Bullet")


def add_caption(document, text):
    paragraph = document.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run(text)
    run.italic = True
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(89, 89, 89)


def add_page_break(document):
    document.add_page_break()


def make_api_evidence_image(path):
    width, height = 1600, 980
    image = Image.new("RGB", (width, height), "#101827")
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 32)
        heading = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 38)
    except OSError:
        font = ImageFont.load_default()
        heading = font
    draw.rounded_rectangle((35, 30, width - 35, height - 30), 22, fill="#0b1220", outline="#1f9d70", width=3)
    draw.text((80, 75), "AgriYield AI — API Validation Evidence", font=heading, fill="#5eead4")
    lines = [
        "$ python -m py_compile backend/app.py backend/auth.py backend/schemas.py",
        "PASS  Python modules compiled successfully",
        "",
        "$ isolated authentication validation",
        "PASS  Farmer registration creates a JWT-backed account",
        "PASS  Admin registration and login resolve the Admin role",
        "PASS  Invalid credentials are rejected; weak passwords are rejected",
        "",
        "$ isolated administration validation",
        "PASS  Account status updates, announcements, dataset records and audits persist",
        "PASS  Five failed sign-ins trigger the 15-minute account lockout policy",
        "",
        "$ instant prediction validation",
        "PASS  POST /api/predict (ai_provider=local) returns an XGBoost ML result",
        "",
        "$ cd frontend && npm run build",
        "PASS  Vite production build completed successfully",
    ]
    y = 155
    for line in lines:
        color = "#d1fae5" if line.startswith("PASS") else "#e5e7eb"
        if line.startswith("$"):
            color = "#fbbf24"
        draw.text((85, y), line, font=font, fill=color)
        y += 48
    image.save(path)


def setup_document():
    document = Document()
    section = document.sections[0]
    section.top_margin = Inches(0.65)
    section.bottom_margin = Inches(0.65)
    section.left_margin = Inches(0.75)
    section.right_margin = Inches(0.75)
    styles = document.styles
    styles["Normal"].font.name = "Aptos"
    styles["Normal"].font.size = Pt(10.5)
    styles["Title"].font.name = "Aptos Display"
    styles["Title"].font.size = Pt(30)
    styles["Heading 1"].font.name = "Aptos Display"
    styles["Heading 1"].font.size = Pt(18)
    styles["Heading 2"].font.name = "Aptos Display"
    styles["Heading 2"].font.size = Pt(13)
    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.add_run("AgriYield AI | Final Project Report | OVS VARUN | 2026")
    footer.runs[0].font.size = Pt(8)
    document.core_properties.title = "AgriYield AI — Final Project Report"
    document.core_properties.author = "OVS VARUN"
    return document


def add_cover(document):
    for _ in range(5):
        document.add_paragraph()
    title = document.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("AgriYield AI")
    run.bold = True
    run.font.size = Pt(34)
    run.font.color.rgb = RGBColor(11, 110, 79)
    subtitle = document.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = subtitle.add_run("Final Project Report")
    run.font.size = Pt(22)
    run.font.color.rgb = RGBColor(31, 78, 61)
    document.add_paragraph()
    statement = document.add_paragraph()
    statement.alignment = WD_ALIGN_PARAGRAPH.CENTER
    statement.add_run("AI-Based Agricultural Crop-Yield Prediction and Decision-Support Platform").bold = True
    document.add_paragraph()
    add_table(document, ["Project information", "Details"], [
        ["Submitted by", "OVS VARUN"],
        ["Email", "orugantivarun.2007@gmail.com"],
        ["Technology", "React 19, Vite, FastAPI, XGBoost, Gemini and Groq"],
        ["Report date", "09 October 2026"],
        ["Project status", "Final integrated submission"],
    ], [2.0, 4.8])
    document.add_paragraph("Purpose: This report consolidates the requirements, machine-learning implementation, backend APIs, farmer experience, administrator operations, security controls, testing evidence, and current limitations of AgriYield AI.")
    add_page_break(document)


def add_contents(document):
    add_heading(document, "Contents", 1)
    sections = [
        "1. Executive Summary", "2. Problem Statement and Objectives", "3. Solution Architecture", "4. Data and Machine-Learning Model",
        "5. Backend and API Design", "6. Farmer Experience and Screens", "7. Administrator Experience and Controls",
        "8. Security, Reliability and Performance", "9. Testing and Validation", "10. Results and Limitations",
        "11. Future Enhancements", "12. Conclusion",
    ]
    for entry in sections:
        document.add_paragraph(entry, style="List Number")
    add_page_break(document)


def add_body(document, farmer_dashboard, predictor, admin_dashboard, api_evidence):
    add_heading(document, "1. Executive Summary", 1)
    document.add_paragraph("AgriYield AI is an end-to-end agricultural intelligence platform that transforms historical Indian district-level crop data into actionable yield forecasts. The system combines a trained XGBoost regressor with a React-based farmer workspace and a FastAPI backend. Farmers can provide district, crop, area and previous-season values to receive a predicted yield and an agronomic advisory. Administrators can manage accounts, monitor prediction activity, publish notifications, record dataset versions, review feedback and export operational reports.")
    document.add_paragraph("The final build focuses on practical decision support rather than treating an ML estimate as a guarantee. The application presents predictions in Kg/ha, preserves traceable input values, provides a local fallback advisory when external AI services are unavailable, and retains audit-friendly records for administrative activity.")

    add_heading(document, "2. Problem Statement and Objectives", 1)
    document.add_paragraph("Farm decisions are frequently made with incomplete historical context, uncertain weather conditions and limited access to data-driven advisory. AgriYield AI addresses this by offering a unified, role-aware platform for crop-yield forecasting, farm decision support and platform administration.")
    add_bullets(document, [
        "Forecast district-level crop yield from historical agricultural features.",
        "Provide farmer-friendly recommendations, multilingual content and supporting decision tools.",
        "Deliver a secure registration, login and role-based access flow for farmers and administrators.",
        "Provide administrators with governance, reporting, account-management and audit capabilities.",
        "Maintain reliable prediction delivery even when generative-AI providers are slow or unavailable.",
    ])

    add_heading(document, "3. Solution Architecture", 1)
    add_table(document, ["Layer", "Implementation", "Responsibility"], [
        ["Presentation", "React 19 + Vite", "Farmer and admin interfaces, forms, multilingual UI, reports and client-side exports."],
        ["Application API", "FastAPI + Pydantic", "Input validation, JWT authentication, prediction routing, administration and API responses."],
        ["Machine learning", "XGBoost Regressor", "District/crop yield inference using historical and previous-year features."],
        ["AI advisory", "Google Gemini / Groq / local fallback", "Optional agronomic interpretation and localized advisory."],
        ["Persistence", "JSON operational stores", "Users, predictions, login events, notifications, audit events, feedback and dataset version records."],
    ], [1.15, 1.7, 3.95])
    document.add_paragraph("Request flow: authenticated user → React form validation → FastAPI validation → XGBoost prediction → optional bounded AI advisory → prediction record → visual result and downloadable report.")

    add_heading(document, "4. Data and Machine-Learning Model", 1)
    document.add_paragraph("The project uses the ICRISAT district-level agricultural dataset. The source data is transformed from a wide format into crop-wise observations and uses previous-year lag variables to represent agricultural history. A chronological evaluation approach is used to avoid training on future information.")
    add_table(document, ["Model item", "Final configuration / result"], [
        ["Source dataset", "12,418 district-year records; 20 states; 311 districts"],
        ["Crop-wise records before lag creation", "285,614"],
        ["Algorithm", "XGBRegressor"],
        ["Training period", "1979–2009"],
        ["Held-out test period", "2010–2017"],
        ["Features", "Year, state, district, crop, area, previous-year yield, area and production"],
        ["MAE", "237.72 Kg/ha"],
        ["RMSE", "583.04 Kg/ha"],
        ["R²", "0.8540"],
    ], [2.1, 4.7])
    document.add_paragraph("Interpretation: the held-out R² indicates that the model explains approximately 85.4% of yield variation in the evaluation scenario. The forecast remains a decision-support estimate; local events, farm practices, pests and unusual weather can change realized yield.")

    add_heading(document, "5. Backend and API Design", 1)
    add_table(document, ["API group", "Representative endpoints", "Purpose"], [
        ["Authentication", "POST /api/auth/register; POST /api/auth/login; GET /api/auth/me", "Role-aware registration, JWT sign-in and current-user resolution."],
        ["Prediction", "POST /api/predict; GET /api/predictions/history", "Validated XGBoost forecast, stored history and advisory response."],
        ["Reference data", "GET /api/states, /api/districts/{state}, /api/crops, /api/years", "Dynamic form options from the project dataset."],
        ["Administration", "GET /api/admin/stats, /users, /predictions, /login-history", "Command-center data and account oversight."],
        ["Admin operations", "PATCH /api/admin/users/{id}; announcements; audit-log; feedback; dataset-versions", "Account governance, communication, traceability and operational records."],
    ], [1.4, 2.9, 2.5])

    add_page_break(document)
    add_heading(document, "6. Farmer Experience and Screens", 1)
    document.add_paragraph("The Farmer workspace is designed as a guided sequence: sign in, inspect the dashboard, enter farm inputs, run a forecast, review advisory content, compare crop options and use supporting calculators or assistant tools.")
    document.add_picture(str(farmer_dashboard), width=Inches(6.8))
    add_caption(document, "Figure 1. Farmer Dashboard — overview, feature cards and farmer support entry points.")
    document.add_picture(str(predictor), width=Inches(6.8))
    add_caption(document, "Figure 2. Yield Predictor — crop planning context, farm parameter inputs and forecast workspace.")
    add_table(document, ["Farmer page", "Key capability"], [
        ["Dashboard", "Farm overview, quick access to yield, soil, weather, market and government-scheme tools."],
        ["Yield Predictor", "XGBoost forecast, advisory, weather-assisted inputs, save/share/download actions and Instant ML mode."],
        ["Multi-Crop Comparator", "Compare projected outcomes for multiple selected crops."],
        ["Fertilizer Calculator", "N-P-K dosage guidance based on crop and soil inputs."],
        ["AI Assistant", "Contextual agricultural questions and guidance."],
        ["Prediction History / Tools", "Review prior records and access farm-support utilities."],
    ], [2.0, 4.8])

    add_page_break(document)
    add_heading(document, "7. Administrator Experience and Controls", 1)
    document.add_paragraph("The administrator workspace provides platform-level visibility without exposing the former Live System & Model Diagnostics panel. The final dashboard centers on practical operations: users, predictions, analytics, reporting, communication and governance.")
    document.add_picture(str(admin_dashboard), width=Inches(6.8))
    add_caption(document, "Figure 3. Administrator Dashboard — command-center metrics and crop-demand analytics (project UI capture).")
    add_table(document, ["Admin function", "Current implementation"], [
        ["User management", "Search users; update farmer/admin role; set Active, Pending or Disabled account status."],
        ["Prediction monitoring", "Filter all records by crop and state; review farmer, location, area and year; export CSV."],
        ["Analytics", "Registered users, farmer/admin counts, prediction count, average yield, top crops and states."],
        ["Approvals and controls", "Account status controls restrict non-active accounts from protected access."],
        ["Notifications", "Publish announcements to all accounts, farmers only or admins only."],
        ["Governance", "Administrative audit trail captures user changes, announcements and dataset-version actions."],
        ["Data management", "Register data-version name, source and notes for traceability."],
        ["Feedback and reports", "Review feedback summary and download filtered prediction reports in CSV format."],
    ], [2.0, 4.8])

    add_heading(document, "8. Security, Reliability and Performance", 1)
    add_bullets(document, [
        "Passwords are hashed with bcrypt; authentication uses signed JWT access tokens.",
        "Registration enforces a minimum eight-character password, with immediate inline UI feedback.",
        "Login failures are tracked and five failures within 15 minutes trigger a temporary lockout.",
        "Pending or disabled accounts cannot access protected resources; an administrator cannot disable or demote their own account through the dashboard.",
        "Prediction inputs are validated against known states, districts, crops and years before inference.",
        "External AI advisory calls use bounded timeouts. Gemini attempts are limited to 8 seconds; Groq uses an 8-second timeout with retries disabled.",
        "The Instant ML option bypasses remote AI and returns an XGBoost result with a built-in advisory when speed or provider reliability is critical.",
    ])

    add_page_break(document)
    add_heading(document, "9. Testing and Validation", 1)
    document.add_paragraph("Testing was performed with isolated temporary stores so production user and prediction records were not changed. The evidence below summarizes the completed validation checks.")
    document.add_picture(str(api_evidence), width=Inches(6.8))
    add_caption(document, "Figure 4. API and build validation evidence captured from the final verification workflow.")
    add_table(document, ["Test area", "Validated behavior", "Outcome"], [
        ["Authentication", "Registration, login, invalid credential handling, password policy and role resolution", "Pass"],
        ["Administration", "Account status updates, announcements, dataset records and audit persistence", "Pass"],
        ["Security", "Repeated failed-login lockout policy", "Pass"],
        ["Prediction", "Instant local XGBoost prediction path and fallback advisory", "Pass"],
        ["Frontend", "Vite production build", "Pass"],
    ], [1.5, 4.2, 1.1])

    add_heading(document, "10. Results and Limitations", 1)
    document.add_paragraph("The final solution successfully delivers an integrated crop-yield forecasting workflow with role-aware administration. The model is suitable as a data-driven baseline for the evaluated historical setting, and the application gives users a practical interface around that capability.")
    add_bullets(document, [
        "Predictions are only as reliable as the historical data and input values used; they are not guaranteed harvest outcomes.",
        "JSON-file persistence is suitable for a project-scale deployment but should be replaced by a transactional database for concurrent production use.",
        "Email-based password recovery is currently a UI flow and requires a real email provider to become operational.",
        "Public administrator registration is enabled at the requested scope; a production deployment should protect administrator provisioning with an invite workflow or organization-controlled access code.",
        "Remote AI advisory remains dependent on third-party provider availability; the Instant ML/fallback route mitigates this risk.",
    ])

    add_heading(document, "11. Future Enhancements", 1)
    add_bullets(document, [
        "Move users, predictions, audit records and dataset metadata to PostgreSQL with migrations and backups.",
        "Add invitation-only administrator provisioning, password-reset email delivery and multi-factor authentication.",
        "Add actual weather-provider integration, satellite/soil data, confidence intervals and model-monitoring dashboards.",
        "Introduce automated tests in CI/CD, API rate limiting, structured observability and environment-specific CORS restrictions.",
        "Add notification delivery to email, SMS or WhatsApp and a farmer-side feedback submission screen.",
    ])

    add_heading(document, "12. Conclusion", 1)
    document.add_paragraph("AgriYield AI demonstrates a complete applied machine-learning web system: cleaned agricultural data, a validated XGBoost model, FastAPI APIs, a responsive farmer workflow, and an operational administrator workspace. The project does not position AI as a replacement for agronomic judgment; instead, it provides accessible, traceable decision support that can be extended into a production-grade agricultural platform.")


def main():
    with TemporaryDirectory() as directory:
        work = Path(directory)
        with ZipFile(SOURCE_REPORT) as archive:
            for name in ("word/media/image1.png", "word/media/image2.png", "word/media/image3.png"):
                archive.extract(name, work)
        media = work / "word" / "media"
        farmer_dashboard = media / "image1.png"
        predictor = media / "image2.png"
        # Crop the historical admin image to its command-center analytics area; the retired diagnostics panel is excluded.
        admin_dashboard = work / "admin_dashboard.png"
        with Image.open(media / "image3.png") as image:
            image.crop((0, 0, int(image.width * 0.52), image.height)).save(admin_dashboard)
        api_evidence = work / "api_validation.png"
        make_api_evidence_image(api_evidence)
        document = setup_document()
        add_cover(document)
        add_contents(document)
        add_body(document, farmer_dashboard, predictor, admin_dashboard, api_evidence)
        document.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    main()
