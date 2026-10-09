import os
import secrets
from contextlib import asynccontextmanager
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from datetime import date, datetime, timedelta, timezone
from uuid import uuid4

import jwt
import numpy as np
import pandas as pd
from catboost import CatBoostRegressor
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field, ValidationError
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Flowable
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from analytics import (
    grouped_average,
    prediction_date_trend,
    prediction_year_trend,
    serialize_rows,
    summarize,
)
from database import (
    create_user,
    ensure_schema,
    fetch_analytics_options,
    fetch_prediction,
    fetch_predictions,
    fetch_user_counts,
    get_user_by_email,
    get_user_by_id,
    insert_prediction,
    list_users,
)
from recommendations import generate_recommendations
from risk import calculate_risk
from passwords import hash_password, verify_password

@asynccontextmanager
async def lifespan(_app):
    ensure_schema()
    yield


app = FastAPI(lifespan=lifespan)


configured_origins = os.getenv("YIELDSENSE_CORS_ORIGINS")
if configured_origins:
    allowed_origins = [
        origin.strip().rstrip("/")
        for origin in configured_origins.split(",")
        if origin.strip()
    ]
else:
    allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
production_frontend_origin = "https://yieldsenseai.vercel.app"
if production_frontend_origin not in allowed_origins:
    allowed_origins.append(production_frontend_origin)
if "*" in allowed_origins:
    raise RuntimeError("YIELDSENSE_CORS_ORIGINS must not contain a wildcard origin.")

vercel_preview_origin_regex = (
    r"^https://yieldsense-[a-z0-9-]+-srinithi-ks-projects\.vercel\.app$"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=vercel_preview_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


MODEL_PATH = Path(__file__).resolve().parent / "models" / "yieldsense_final_catboost.cbm"
MODEL_TRAINING_DATA_PATH = (
    Path(__file__).resolve().parent.parent
    / "dataset"
    / "final_cleaned_crop_yield_train.csv"
)
MODEL_FEATURES = [
    "Year",
    "State",
    "Crop",
    "Season",
    "Area",
    "Annual_Rainfall",
    "Fertilizer",
    "Pesticide",
]
MODEL_ENGINEERED_FEATURES = [
    "Fertilizer_per_Area",
    "Pesticide_per_Area",
    "Crop_Season",
    "Crop_State",
]

JWT_SECRET = os.getenv("YIELDSENSE_JWT_SECRET") or os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET:
    if os.getenv("YIELDSENSE_ENVIRONMENT", "development").lower() == "production":
        raise RuntimeError("YIELDSENSE_JWT_SECRET must be configured in production.")
    JWT_SECRET = secrets.token_urlsafe(48)
JWT_ALGORITHM = os.getenv("YIELDSENSE_JWT_ALGORITHM") or os.getenv("JWT_ALGORITHM") or "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("YIELDSENSE_JWT_EXPIRE_MINUTES", "480"))

security = HTTPBearer(auto_error=False)


def create_access_token(subject: str, role: str, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "role": role,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=JWT_EXPIRE_MINUTES)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token.") from exc
    return payload


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials if credentials else None
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    payload = decode_access_token(token)
    user = get_user_by_id(payload.get("sub"))
    if not user or not user.get("is_active"):
        raise HTTPException(status_code=401, detail="User not found or inactive.")
    return user


def require_farmer(current_user=Depends(get_current_user)):
    if current_user.get("role") != "farmer":
        raise HTTPException(status_code=403, detail="Farmer access required.")
    return current_user


def require_admin(current_user=Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return current_user


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    Year: float = Field(..., finite=True)
    State: str
    District: str | None = None
    Crop: str
    Season: str
    Area: float = Field(..., finite=True)
    Annual_Rainfall: float = Field(..., finite=True)
    Fertilizer: float = Field(..., finite=True)
    Pesticide: float = Field(..., finite=True)


class RecommendationRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    crop: str
    state: str
    district: str | None = None
    season: str
    predictedYield: float | str | None = None
    prediction_id: str | None = None
    weather: dict | str | None = None
    soil: dict | str | None = None
    weatherAnalysis: dict | None = None
    soilAnalysis: dict | None = None
    detectedRisks: list[str] = []


class RiskAssessmentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    weather_analysis: dict | None = None
    soil_analysis: dict | None = None
    predicted_yield: float | None = Field(default=None, finite=True)


def _public_user(user):
    created_at = user.get("created_at")
    return {
        "id": str(user["id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "is_active": user["is_active"],
        "created_at": created_at.isoformat() if created_at else None,
        "location_state": user.get("location_state"),
        "location_district": user.get("location_district"),
    }


model = CatBoostRegressor()
try:
    model.load_model(str(MODEL_PATH))
except Exception as error:
    model = None
    MODEL_LOAD_ERROR = error
else:
    MODEL_LOAD_ERROR = None


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=400, content={"detail": "Invalid prediction input."})


@app.get("/")
def home():
    return {"message": "YieldSense AI Backend is working!"}


@app.get("/api/test")
def test_api():
    return {"message": "Frontend and Backend are connected!"}


@app.post("/api/auth/register")
def register_user(payload: RegisterRequest):
    ensure_schema()
    email = payload.email.strip().lower()
    if not payload.name.strip() or not email:
        raise HTTPException(status_code=400, detail="Name and email are required.")
    if get_user_by_email(email):
        raise HTTPException(status_code=409, detail="An account with that email already exists.")
    user_id = str(uuid4())
    user_record = {
        "id": user_id,
        "name": payload.name.strip(),
        "email": email,
        "password_hash": hash_password(payload.password),
        "role": "farmer",
        "is_active": True,
    }
    saved_user = create_user(user_record)
    return {
        "message": "Farmer account created successfully.",
        "user": _public_user(saved_user),
    }


@app.post("/api/auth/login")
def login_user(payload: LoginRequest):
    ensure_schema()
    email = payload.email.strip().lower()
    user = get_user_by_email(email)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.get("is_active"):
        raise HTTPException(status_code=403, detail="This account is inactive.")
    token = create_access_token(str(user["id"]), user["role"], user["email"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": _public_user(user),
    }


@app.get("/api/auth/me")
def auth_me(current_user=Depends(get_current_user)):
    return _public_user(current_user)


@app.get("/api/admin/users")
def admin_users(current_user=Depends(require_admin)):
    return {"items": list_users()}


@app.get("/api/admin/predictions")
def admin_predictions(current_user=Depends(require_admin)):
    return {"items": fetch_predictions()}


@app.get("/api/admin/users/{user_id}/predictions")
def admin_user_predictions(user_id: str, current_user=Depends(require_admin)):
    rows = fetch_predictions({"user_id": user_id})
    return {"items": rows}


@app.get("/api/admin/analytics/summary")
def admin_analytics_summary(
    crop: str | None = None,
    state: str | None = None,
    season: str | None = None,
    year: int | None = None,
    current_user=Depends(require_admin),
):
    return summarize(fetch_predictions(_filters(crop, state, season, year)))


@app.get("/api/admin/analytics/dashboard")
def admin_analytics_dashboard(
    crop: str | None = None,
    state: str | None = None,
    season: str | None = None,
    year: int | None = None,
    current_user=Depends(require_admin),
):
    try:
        return _build_analytics_dashboard(crop, state, season, year)
    except Exception as error:
        raise HTTPException(status_code=503, detail="Admin analytics are unavailable.") from error


@app.get("/api/admin/reports/summary")
def admin_report_summary(
    crop: str | None = None,
    state: str | None = None,
    season: str | None = None,
    year: int | None = None,
    current_user=Depends(require_admin),
):
    try:
        return _build_report(crop, state, season, year, current_user)
    except Exception as error:
        raise HTTPException(status_code=503, detail="Admin report data is unavailable.") from error


def _safe_context(request):
    values = request.model_dump()
    return values


@app.post("/api/predict")
def predict(
    request: PredictionRequest,
    current_user=Depends(require_farmer),
):
    if MODEL_LOAD_ERROR is not None or model is None:
        raise HTTPException(status_code=500, detail="Prediction model is unavailable.")

    try:
        values = request.model_dump()
        area = values["Area"]
        features = pd.DataFrame([values], columns=MODEL_FEATURES)
        features["Fertilizer_per_Area"] = values["Fertilizer"] / area if area else np.nan
        features["Pesticide_per_Area"] = values["Pesticide"] / area if area else np.nan
        features["Crop_Season"] = f'{values["Crop"]}_{values["Season"]}'
        features["Crop_State"] = f'{values["Crop"]}_{values["State"]}'
        features = features[MODEL_FEATURES + MODEL_ENGINEERED_FEATURES]
        features = features.replace([np.inf, -np.inf], np.nan)
        if features.isna().any().any():
            raise ValueError("Area must be non-zero.")
        prediction = float(model.predict(features)[0])
    except (ValidationError, ValueError, TypeError) as error:
        raise HTTPException(status_code=400, detail=f"Invalid prediction input: {error}") from error
    except Exception as error:
        raise HTTPException(status_code=500, detail="Unable to generate prediction.") from error

    predicted_yield = max(0.0, prediction)
    prediction_id = str(uuid4())
    record = {
        "prediction_id": prediction_id,
        "user_id": str(current_user["id"]),
        "crop": values["Crop"],
        "state": values["State"],
        "district": values.get("District"),
        "season": values["Season"],
        "year": int(values["Year"]),
        "predicted_yield": predicted_yield,
        "context": values,
    }
    try:
        ensure_schema()
        insert_prediction(record)
    except Exception as error:
        raise HTTPException(status_code=503, detail="Prediction could not be saved.") from error

    response = {
        "predicted_yield": predicted_yield,
        "unit": "metric tons/hectare",
        "prediction_id": str(prediction_id),
    }
    return response


@lru_cache(maxsize=1)
def _prediction_input_options():
    if not MODEL_TRAINING_DATA_PATH.is_file():
        raise FileNotFoundError("The prediction training dataset is unavailable.")
    frame = pd.read_csv(
        MODEL_TRAINING_DATA_PATH,
        usecols=["Crop", "State", "Season"],
    )
    return {
        column.lower(): sorted(
            frame[column].dropna().astype(str).unique().tolist()
        )
        for column in ("Crop", "State", "Season")
    }


@app.get("/api/prediction/options")
def prediction_input_options(current_user=Depends(require_farmer)):
    try:
        return _prediction_input_options()
    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail="Prediction input options are unavailable.",
        ) from error


def _filters(crop=None, state=None, season=None, year=None, user_id=None):
    return {
        key: value
        for key, value in {
            "crop": crop,
            "state": state,
            "season": season,
            "year": year,
            "user_id": user_id,
        }.items()
        if value not in (None, "")
    }


def _build_analytics_dashboard(crop, state, season, year, user_id=None):
    filters = _filters(crop, state, season, year, user_id)
    rows = fetch_predictions(filters)
    options = fetch_analytics_options(user_id)
    return {
        "filters": {
            "crop": crop or "",
            "state": state or "",
            "season": season or "",
            "year": str(year) if year is not None else "",
        },
        "options": options,
        "summary": summarize(rows),
        "history": serialize_rows(rows),
        "crops": grouped_average(rows, "crop"),
        "states": grouped_average(rows, "state"),
        "seasons": grouped_average(rows, "season"),
        "trend": prediction_date_trend(rows),
        "yearly": prediction_year_trend(rows),
    }


@app.get("/api/analytics/dashboard")
def farmer_analytics_dashboard(
    crop: str | None = None,
    state: str | None = None,
    season: str | None = None,
    year: int | None = None,
    current_user=Depends(require_farmer),
):
    try:
        return _build_analytics_dashboard(
            crop, state, season, year, str(current_user["id"])
        )
    except Exception as error:
        raise HTTPException(status_code=503, detail="Analytics data is unavailable.") from error


@app.get("/api/analytics/summary")
def analytics_summary(
    crop: str | None = None,
    state: str | None = None,
    season: str | None = None,
    year: int | None = None,
    current_user=Depends(require_farmer),
):
    try:
        return summarize(fetch_predictions(_filters(crop, state, season, year, current_user["id"])))
    except Exception as error:
        raise HTTPException(status_code=503, detail="Analytics data is unavailable.") from error


@app.get("/api/analytics/history")
def analytics_history(
    crop: str | None = None,
    state: str | None = None,
    season: str | None = None,
    year: int | None = None,
    current_user=Depends(require_farmer),
):
    try:
        return {"items": serialize_rows(fetch_predictions(_filters(crop, state, season, year, current_user["id"])))}
    except Exception as error:
        raise HTTPException(status_code=503, detail="Prediction history is unavailable.") from error


@app.get("/api/analytics/crops")
def analytics_crops(
    crop: str | None = None,
    state: str | None = None,
    season: str | None = None,
    year: int | None = None,
    current_user=Depends(require_farmer),
):
    try:
        return {"items": grouped_average(fetch_predictions(_filters(crop, state, season, year, current_user["id"])), "crop")}
    except Exception as error:
        raise HTTPException(status_code=503, detail="Crop analytics are unavailable.") from error


@app.get("/api/analytics/seasons")
def analytics_seasons(
    crop: str | None = None,
    state: str | None = None,
    season: str | None = None,
    year: int | None = None,
    current_user=Depends(require_farmer),
):
    try:
        return {"items": grouped_average(fetch_predictions(_filters(crop, state, season, year, current_user["id"])), "season")}
    except Exception as error:
        raise HTTPException(status_code=503, detail="Season analytics are unavailable.") from error

@app.get("/api/analytics/options")
def analytics_options(current_user=Depends(require_farmer)):
    try:
        return fetch_analytics_options(str(current_user["id"]))
    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail="Analytics options are unavailable."
        ) from error
    
@app.post("/api/recommendations")
def recommendations(request: RecommendationRequest, current_user=Depends(require_farmer)):
    try:
        context = _safe_context(request)
        if request.prediction_id:
            prediction = fetch_prediction(request.prediction_id)
            if not prediction or str(prediction.get("user_id")) != str(current_user["id"]):
                raise HTTPException(status_code=404, detail="Prediction was not found for this account.")
            context.update({
                "prediction_id": str(prediction["prediction_id"]),
                "crop": prediction["crop"],
                "state": prediction["state"],
                "district": prediction.get("district"),
                "season": prediction["season"],
                "predictedYield": prediction["predicted_yield"],
            })
        return generate_recommendations(context)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=502, detail="Unable to generate recommendations.") from error


@app.post("/api/risk")
def assess_risk(
    request: RiskAssessmentRequest,
    current_user=Depends(get_current_user),
):
    return calculate_risk(
        weather_analysis=request.weather_analysis,
        soil_analysis=request.soil_analysis,
        predicted_yield=request.predicted_yield,
    )


@app.get("/api/reports/summary")
def report_summary(
    crop: str | None = None,
    state: str | None = None,
    season: str | None = None,
    year: int | None = None,
    current_user=Depends(get_current_user),
):
    try:
        return _build_report(crop, state, season, year, current_user)
    except Exception as error:
        raise HTTPException(status_code=503, detail="Report data is unavailable.") from error


def _build_report(crop, state, season, year, current_user):
    user_id = current_user["id"] if current_user["role"] == "farmer" else None
    rows = fetch_predictions(_filters(crop, state, season, year, user_id))
    report = {
        "generated_at": date.today().isoformat(),
        "role": current_user["role"],
        "filters": {
            "crop": crop or "",
            "state": state or "",
            "season": season or "",
            "year": str(year) if year is not None else "",
        },
        "options": fetch_analytics_options(user_id),
        "summary": summarize(rows),
        "crops": grouped_average(rows, "crop"),
        "states": grouped_average(rows, "state"),
        "seasons": grouped_average(rows, "season"),
        "trend": prediction_date_trend(rows),
        "yearly": prediction_year_trend(rows),
        "history": serialize_rows(rows[:30]),
        "matching_record_count": len(rows),
    }
    if current_user["role"] == "admin":
        report["users"] = fetch_user_counts()
    else:
        report["user"] = _public_user(current_user)
    return report


def _pdf_safe(value):
    return str(value).encode("cp1252", "replace").decode("cp1252")


def _pdf_paragraph(value, style):
    from xml.sax.saxutils import escape

    return Paragraph(escape(_pdf_safe(value)), style)


class _ReportBarChart(Flowable):
    def __init__(self, items, value_key="average_yield", value_label="t/ha"):
        super().__init__()
        self.items = items
        self.value_key = value_key
        self.value_label = value_label
        self.width = 470
        self.height = 190

    def wrap(self, available_width, available_height):
        self.width = min(available_width, 470)
        return self.width, self.height

    def draw(self):
        if not self.items:
            return
        canvas = self.canv
        values = [float(item[self.value_key]) for item in self.items]
        maximum = max(values) or 1
        left = 34
        right = self.width - 8
        bottom = 32
        top = self.height - 10
        plot_width = right - left
        plot_height = top - bottom

        canvas.setStrokeColor(colors.HexColor("#d7e0d8"))
        canvas.line(left, bottom, right, bottom)
        canvas.line(left, bottom, left, top)
        count = len(self.items)
        gap = min(12, plot_width / count * 0.22)
        bar_width = max(4, (plot_width - gap * count) / count)
        canvas.setFillColor(colors.HexColor("#4f8060"))
        canvas.setFont("Helvetica", 7)
        for index, (item, value) in enumerate(zip(self.items, values)):
            x = left + index * (bar_width + gap) + gap / 2
            bar_height = plot_height * value / maximum
            canvas.rect(x, bottom, bar_width, bar_height, stroke=0, fill=1)
            label = _pdf_safe(item.get("name", item.get("period", "")))[:12]
            canvas.setFillColor(colors.HexColor("#57635a"))
            canvas.drawCentredString(x + bar_width / 2, bottom - 11, label)
            canvas.setFillColor(colors.HexColor("#4f8060"))
            canvas.drawCentredString(
                x + bar_width / 2, bottom + bar_height + 3, f"{value:.1f}"
            )
        canvas.setFillColor(colors.HexColor("#758078"))
        canvas.setFont("Helvetica", 7)
        canvas.drawString(0, top - 2, self.value_label)


def _report_table(rows, widths, header=True):
    table = Table(rows, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#edf3ee")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#315b3d")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#333b35")),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#dce5dd")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [
                    colors.white,
                    colors.HexColor("#f7faf7"),
                ]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def _report_page(canvas, document):
    canvas.saveState()
    page_width, _ = letter
    canvas.setFillColor(colors.HexColor("#315b3d"))
    canvas.roundRect(42, 746, 24, 24, 6, stroke=0, fill=1)
    canvas.setStrokeColor(colors.white)
    canvas.setLineWidth(1.5)
    canvas.line(48, 752, 59, 764)
    canvas.line(53, 751, 60, 759)
    canvas.setFillColor(colors.HexColor("#25352b"))
    canvas.setFont("Helvetica-Bold", 10)
    canvas.drawString(74, 757, "YieldSense AI")
    canvas.setStrokeColor(colors.HexColor("#dce5dd"))
    canvas.line(42, 738, page_width - 42, 738)
    canvas.setFillColor(colors.HexColor("#77827a"))
    canvas.setFont("Helvetica", 8)
    canvas.drawString(42, 28, f"Generated {date.today().isoformat()} - YieldSense AI")
    canvas.drawRightString(page_width - 42, 28, f"Page {document.page}")
    canvas.restoreState()


def _create_report_pdf(report):
    buffer = BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.6 * inch,
        leftMargin=0.6 * inch,
        topMargin=0.85 * inch,
        bottomMargin=0.62 * inch,
        title=(
            "Personal Crop Yield Report"
            if report["role"] == "farmer"
            else "System-wide Analytics Report"
        ),
        author="YieldSense AI",
    )
    base_styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "YieldSenseTitle",
        parent=base_styles["Title"],
        alignment=TA_LEFT,
        textColor=colors.HexColor("#25352b"),
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=25,
        spaceAfter=7,
    )
    heading_style = ParagraphStyle(
        "YieldSenseSection",
        parent=base_styles["Heading2"],
        textColor=colors.HexColor("#315b3d"),
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        spaceBefore=12,
        spaceAfter=7,
    )
    body_style = ParagraphStyle(
        "YieldSenseBody",
        parent=base_styles["BodyText"],
        textColor=colors.HexColor("#536057"),
        fontSize=9,
        leading=13,
    )
    small_style = ParagraphStyle(
        "YieldSenseSmall",
        parent=body_style,
        fontSize=8,
        leading=11,
    )
    story = []
    is_farmer = report["role"] == "farmer"
    story.append(
        _pdf_paragraph(
            "Personal Crop Yield Report" if is_farmer else "System-wide Analytics Report",
            title_style,
        )
    )
    story.append(
        _pdf_paragraph(
            f"Generated {report['generated_at']} - "
            f"{report['matching_record_count']} matching predictions",
            body_style,
        )
    )
    if is_farmer:
        user = report["user"]
        location = ", ".join(
            part for part in (user.get("location_district"), user.get("location_state")) if part
        ) or "No saved farm location"
        story.append(
            _pdf_paragraph(
                f"{user['name']} | {user['email']} | {location}",
                small_style,
            )
        )
    else:
        users = report["users"]
        story.append(
            _pdf_paragraph(
                f"Registered accounts: {users['total_users']} | Farmers: "
                f"{users['total_farmers']} | Active farmers: {users['active_farmers']}",
                small_style,
            )
        )

    filter_rows = [["Applied filter", "Selection"]]
    filter_labels = [
        ("crop", "Crop"),
        ("state", "State"),
        ("season", "Season"),
        ("year", "Year"),
    ]
    for key, label in filter_labels:
        filter_rows.append([label, report["filters"][key] or "All"])
    story.extend(
        [
            Spacer(1, 10),
            _pdf_paragraph("Report scope", heading_style),
            _report_table(filter_rows, [1.65 * inch, 4.9 * inch]),
            _pdf_paragraph("Yield summary", heading_style),
        ]
    )
    summary = report["summary"]
    summary_rows = [
        ["Metric", "Value"],
        ["Matching predictions", str(summary["count"])],
        ["Average yield", _format_yield(summary["average_yield"])],
        ["Highest yield", _format_yield(summary["highest_yield"])],
        ["Lowest yield", _format_yield(summary["lowest_yield"])],
    ]
    story.append(_report_table(summary_rows, [3.1 * inch, 3.45 * inch]))

    if not report["history"]:
        story.append(
            _pdf_paragraph(
                "No data available for the selected filters.",
                body_style,
            )
        )
    else:
        groups = (
            [
                ("Crop performance", report["crops"]),
                ("Region performance", report["states"]),
                ("Season performance", report["seasons"]),
            ]
            if not is_farmer
            else [
                ("Crop performance", report["crops"]),
                ("Season performance", report["seasons"]),
            ]
        )
        for title, items in groups:
            if items:
                story.append(_pdf_paragraph(title, heading_style))
                rows = [["Group", "Predictions", "Average yield"]]
                rows.extend(
                    [
                        _pdf_safe(item["name"]),
                        str(item["count"]),
                        _format_yield(item["average_yield"]),
                    ]
                    for item in items
                )
                story.append(_report_table(rows, [2.8 * inch, 1.45 * inch, 2.3 * inch]))
                if len(items) > 1:
                    story.append(Spacer(1, 5))
                    story.append(_ReportBarChart(items))

        trend = report["yearly"] if not is_farmer else report["trend"]
        if len(trend) > 1:
            story.append(
                _pdf_paragraph(
                    "Year-wise yield trend" if not is_farmer else "Recent yield trend",
                    heading_style,
                )
            )
            story.append(_ReportBarChart(trend))

        if not is_farmer and len(report["trend"]) > 1:
            story.append(_pdf_paragraph("Prediction volume over time", heading_style))
            story.append(_ReportBarChart(report["trend"], "count", "predictions"))

        if is_farmer:
            story.append(
                _pdf_paragraph(
                    "Weather observations, soil-test readings, risk assessments and AI "
                    "recommendations are not stored with these prediction records, so "
                    "they are not represented as measured report data.",
                    small_style,
                )
            )
        else:
            story.append(
                _pdf_paragraph(
                    "Risk distribution is omitted because risk assessments are not "
                    "persisted per prediction.",
                    small_style,
                )
            )

        story.append(_pdf_paragraph("Recent prediction history", heading_style))
        history_rows = [[
            "Crop",
            "State",
            "Season",
            "Year",
            "Yield",
            "Date",
        ]]
        history_rows.extend(
            [
                _pdf_safe(row["crop"]),
                _pdf_safe(row["state"]),
                _pdf_safe(row["season"]),
                str(row["year"]),
                _format_yield(row["predicted_yield"]),
                row["created_at"][:10] if row["created_at"] else "Unavailable",
            ]
            for row in report["history"]
        )
        story.append(
            _report_table(
                history_rows,
                [1.1 * inch, 1.25 * inch, 1.05 * inch, 0.55 * inch, 1.15 * inch, 1.45 * inch],
            )
        )
        if report["matching_record_count"] > len(report["history"]):
            story.append(
                _pdf_paragraph(
                    f"Showing the most recent {len(report['history'])} of "
                    f"{report['matching_record_count']} matching records.",
                    small_style,
                )
            )

    document.build(story, onFirstPage=_report_page, onLaterPages=_report_page)
    return buffer.getvalue()


@app.get("/api/reports/pdf")
def report_pdf(
    crop: str | None = None,
    state: str | None = None,
    season: str | None = None,
    year: int | None = None,
    current_user=Depends(get_current_user),
):
    try:
        report = _build_report(crop, state, season, year, current_user)
        pdf = _create_report_pdf(report)
        return Response(
            content=pdf,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=yieldsense-report.pdf"},
        )
    except Exception as error:
        raise HTTPException(status_code=503, detail="PDF report is unavailable.") from error


def _format_yield(value):
    return "Unavailable" if value is None else f"{value:.2f} t/ha"