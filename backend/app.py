from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

try:
    from .dataset_service import DatasetService
    from .groq_service import GroqService
    from .gemini_service import GeminiService
    from .predictor import YieldPredictor
    from .enhancements_service import EnhancementService, CROP_AGRO_DATABASE
    from .auth import (
        auth_store,
        login_history_store,
        create_access_token,
        get_current_user,
        get_optional_user,
        get_current_admin
    )
    from .prediction_store import prediction_store
    from .admin_operations import admin_operations_store
    from .schemas import (
        PredictionRequest,
        PredictionResponse,
        UserRegisterRequest,
        UserLoginRequest,
        TokenResponse,
        UserResponse,
        AdminUserUpdateRequest,
        AnnouncementRequest,
        FeedbackRequest,
        DatasetVersionRequest,
        AIChatRequest,
        AIChatResponse,
        FertilizerRequest,
        FertilizerResponse,
        MultiCropCompareRequest,
        MultiCropCompareResponse,
        CropComparisonItem,
        WeatherForecastResponse,
        PestRiskRequest,
        PestRiskResponse,
        TranslateRequest,
        TranslateResponse
    )
except ImportError:
    from dataset_service import DatasetService
    from groq_service import GroqService
    from gemini_service import GeminiService
    from predictor import YieldPredictor
    from enhancements_service import EnhancementService, CROP_AGRO_DATABASE
    from auth import (
        auth_store,
        login_history_store,
        create_access_token,
        get_current_user,
        get_optional_user,
        get_current_admin
    )
    from prediction_store import prediction_store
    from admin_operations import admin_operations_store
    from schemas import (
        PredictionRequest,
        PredictionResponse,
        UserRegisterRequest,
        UserLoginRequest,
        TokenResponse,
        UserResponse,
        AdminUserUpdateRequest,
        AnnouncementRequest,
        FeedbackRequest,
        DatasetVersionRequest,
        AIChatRequest,
        AIChatResponse,
        FertilizerRequest,
        FertilizerResponse,
        MultiCropCompareRequest,
        MultiCropCompareResponse,
        CropComparisonItem,
        WeatherForecastResponse,
        PestRiskRequest,
        PestRiskResponse,
        TranslateRequest,
        TranslateResponse
    )

app = FastAPI(
    title="AgriYield AI",
    description="AI-powered agricultural crop yield prediction system with Groq & Google Gemini dual intelligence and Role-Based JWT Auth",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Services
predictor = YieldPredictor()
dataset_service = DatasetService()

# AI Services with graceful initialization
try:
    groq_service = GroqService()
except Exception as e:
    print(f"⚠️ Groq Service init warning: {e}")
    groq_service = None

try:
    gemini_service = GeminiService()
except Exception as e:
    print(f"⚠️ Gemini Service init warning: {e}")
    gemini_service = None

enhancement_service = EnhancementService(gemini_service=gemini_service, groq_service=groq_service)


@app.get("/")
def home():
    return {
        "message": "AgriYield AI Backend v2.0 Running",
        "version": "2.0.0",
        "models": {
            "ml_model": "XGBoost Regressor",
            "groq_ai": "Active" if groq_service else "Disabled",
            "gemini_ai": "Active" if gemini_service and gemini_service.api_key else "Disabled"
        }
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "message": "Backend running seamlessly",
        "model": "XGBoost",
        "ai_providers": {
            "groq": groq_service is not None,
            "gemini": gemini_service is not None and bool(gemini_service.api_key)
        }
    }


# ============================================================
# AUTHENTICATION ENDPOINTS
# ============================================================

@app.post("/api/auth/register", response_model=TokenResponse)
def register(request: UserRegisterRequest):
    user = auth_store.create_user(
        email=request.email,
        password=request.password,
        full_name=request.full_name,
        role=request.role,
        farm_location=request.farm_location
    )
    token = create_access_token({"sub": user["id"], "role": user["role"]})
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            farm_location=user.get("farm_location", ""),
            created_at=user["created_at"]
        )
    )


@app.post("/api/auth/login", response_model=TokenResponse)
def login(request: UserLoginRequest):
    if login_history_store.is_locked(request.email):
        raise HTTPException(status_code=429, detail="Too many failed sign-in attempts. Please try again in 15 minutes.")
    user = auth_store.find_by_email(request.email)
    if not user or not auth_store.verify_password(request.password, user["password_hash"]):
        login_history_store.record_login(request.email, "FAILED")
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password. Please try again."
        )
    if user.get("account_status", "active") != "active":
        login_history_store.record_login(request.email, "BLOCKED", user=user)
        raise HTTPException(status_code=403, detail="This account is not active. Please contact an administrator.")

    login_history_store.record_login(request.email, "SUCCESS", user=user)

    token = create_access_token({"sub": user["id"], "role": user["role"]})
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            farm_location=user.get("farm_location", ""),
            created_at=user["created_at"]
        )
    )


@app.get("/api/admin/login-history")
def get_login_history(admin: dict = Depends(get_current_admin)):
    history = login_history_store.get_all()
    return {"success": True, "count": len(history), "logs": history}


@app.get("/api/auth/me", response_model=UserResponse)
def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        farm_location=user.get("farm_location", ""),
        created_at=user["created_at"]
    )


# ============================================================
# DATASET METADATA ENDPOINTS
# ============================================================

@app.get("/api/states")
def get_states():
    return {
        "success": True,
        "states": dataset_service.get_states()
    }


@app.get("/api/districts/{state}")
def get_districts(state: str):
    districts = dataset_service.get_districts(state)
    return {
        "success": True,
        "state": state,
        "districts": districts
    }


@app.get("/api/crops")
def get_crops():
    return {
        "success": True,
        "crops": dataset_service.get_crops()
    }


@app.get("/api/years")
def get_years():
    return {
        "success": True,
        "years": dataset_service.get_years()
    }


# ============================================================
# CROP YIELD PREDICTION & AI ANALYSIS
# ============================================================

@app.post("/api/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest, user: Optional[dict] = Depends(get_optional_user)):
    try:
        # Validate input
        states = dataset_service.get_states()
        if request.State_Name not in states:
            raise HTTPException(status_code=400, detail=f"Invalid state: '{request.State_Name}'")

        districts = dataset_service.get_districts(request.State_Name)
        if request.Dist_Name not in districts:
            raise HTTPException(
                status_code=400,
                detail=f"District '{request.Dist_Name}' does not belong to state '{request.State_Name}'."
            )

        crops = dataset_service.get_crops()
        if request.Crop not in crops:
            raise HTTPException(status_code=400, detail=f"Invalid crop: '{request.Crop}'")

        years = dataset_service.get_years()
        if request.Year not in years:
            raise HTTPException(status_code=400, detail=f"Invalid year: {request.Year}")

        # Run XGBoost ML Model
        predicted_yield = predictor.predict(
            Year=request.Year,
            State_Name=request.State_Name,
            Dist_Name=request.Dist_Name,
            Crop=request.Crop,
            Area=request.Area,
            Previous_Year_Yield=request.Previous_Year_Yield,
            Previous_Year_Area=request.Previous_Year_Area,
            Previous_Year_Production=request.Previous_Year_Production
        )
        predicted_yield = round(predicted_yield, 2)

        # AI Analysis provider routing (Groq / Gemini / Auto)
        requested_provider = (request.ai_provider or "auto").lower()
        ai_analysis = ""
        provider_used = "XGBoost ML"

        # Try requested AI provider with fallback
        lang = request.language or "English"
        if requested_provider in ["gemini", "auto"] and gemini_service and gemini_service.api_key:
            try:
                ai_analysis = gemini_service.analyze_prediction(
                    year=request.Year,
                    state_name=request.State_Name,
                    district_name=request.Dist_Name,
                    crop=request.Crop,
                    area=request.Area,
                    previous_yield=request.Previous_Year_Yield,
                    previous_area=request.Previous_Year_Area,
                    previous_production=request.Previous_Year_Production,
                    predicted_yield=predicted_yield,
                    language=lang
                )
                provider_used = "Google Gemini"
            except Exception as gemini_err:
                print(f"Gemini analysis attempt failed: {gemini_err}")

        if not ai_analysis and (requested_provider in ["groq", "auto"]) and groq_service:
            try:
                ai_analysis = groq_service.analyze_prediction(
                    year=request.Year,
                    state_name=request.State_Name,
                    district_name=request.Dist_Name,
                    crop=request.Crop,
                    area=request.Area,
                    previous_yield=request.Previous_Year_Yield,
                    previous_area=request.Previous_Year_Area,
                    previous_production=request.Previous_Year_Production,
                    predicted_yield=predicted_yield,
                    language=lang
                )
                provider_used = "Groq LLaMA"
            except Exception as groq_err:
                print(f"Groq analysis attempt failed: {groq_err}")

        if not ai_analysis:
            ai_analysis = generate_localized_fallback_report(
                crop=request.Crop,
                state=request.State_Name,
                district=request.Dist_Name,
                year=request.Year,
                predicted_yield=predicted_yield,
                area=request.Area,
                previous_yield=request.Previous_Year_Yield,
                language=lang
            )

        # Save prediction record
        record = prediction_store.add_prediction(
            request_dict=request.dict(),
            predicted_yield=predicted_yield,
            ai_analysis=ai_analysis,
            ai_provider_used=provider_used,
            user=user
        )

        return PredictionResponse(
            success=True,
            id=record["id"],
            Year=request.Year,
            State_Name=request.State_Name,
            Dist_Name=request.Dist_Name,
            Crop=request.Crop,
            predicted_yield=predicted_yield,
            unit="Kg per ha",
            model="XGBoost",
            ai_analysis=ai_analysis,
            ai_provider_used=provider_used
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


# ============================================================
# PREDICTION HISTORY & USER RECORD ENDPOINTS
# ============================================================

@app.get("/api/predictions/history")
def get_prediction_history(user: dict = Depends(get_current_user)):
    if user.get("role") == "admin":
        records = prediction_store.get_all_predictions()
    else:
        records = prediction_store.get_user_history(user["id"])

    return {
        "success": True,
        "count": len(records),
        "history": records
    }


@app.delete("/api/predictions/{pred_id}")
def delete_prediction(pred_id: str, user: dict = Depends(get_current_user)):
    success = prediction_store.delete_prediction(pred_id, user)
    if not success:
        raise HTTPException(status_code=404, detail="Prediction record not found or permission denied.")
    return {"success": True, "message": "Prediction record deleted successfully."}


# ============================================================
# ADMIN DASHBOARD ENDPOINTS
# ============================================================

@app.get("/api/admin/stats")
def get_admin_stats(admin: dict = Depends(get_current_admin)):
    stats = prediction_store.get_admin_stats()
    all_users = auth_store.get_all_users()
    stats["total_registered_users"] = len(all_users)
    stats["farmers_count"] = len([u for u in all_users if u["role"] == "farmer"])
    stats["admins_count"] = len([u for u in all_users if u["role"] == "admin"])
    stats["system_status"] = {
        "xgboost_model": "Healthy",
        "groq_api": "Online" if groq_service else "Offline",
        "gemini_api": "Online" if gemini_service and gemini_service.api_key else "Offline"
    }
    return {"success": True, "stats": stats}


@app.get("/api/admin/users")
def get_all_users(admin: dict = Depends(get_current_admin)):
    users = auth_store.get_all_users()
    return {"success": True, "count": len(users), "users": users}


@app.get("/api/admin/predictions")
def get_all_admin_predictions(admin: dict = Depends(get_current_admin)):
    preds = prediction_store.get_all_predictions()
    return {"success": True, "count": len(preds), "predictions": preds}


@app.patch("/api/admin/users/{user_id}")
def update_admin_user(user_id: str, request: AdminUserUpdateRequest, admin: dict = Depends(get_current_admin)):
    if user_id == admin["id"] and request.account_status in {"pending", "disabled"}:
        raise HTTPException(status_code=400, detail="You cannot disable your own account.")
    if user_id == admin["id"] and request.role == "farmer":
        raise HTTPException(status_code=400, detail="You cannot remove your own administrator role.")
    user = auth_store.update_user(user_id, request.role, request.account_status)
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
    details = ", ".join(f"{key}={value}" for key, value in request.model_dump(exclude_none=True).items())
    admin_operations_store.audit(admin, "Updated user account", user["email"], details)
    clean_user = next(item for item in auth_store.get_all_users() if item["id"] == user_id)
    return {"success": True, "user": clean_user}


@app.post("/api/admin/announcements")
def create_announcement(request: AnnouncementRequest, admin: dict = Depends(get_current_admin)):
    return {"success": True, "notification": admin_operations_store.create_notification(admin, request.message, request.audience)}


@app.get("/api/admin/announcements")
def get_announcements(admin: dict = Depends(get_current_admin)):
    return {"success": True, "notifications": admin_operations_store.get_all("notifications")}


@app.get("/api/admin/audit-log")
def get_audit_log(admin: dict = Depends(get_current_admin)):
    return {"success": True, "events": admin_operations_store.get_all("audits")}


@app.get("/api/admin/feedback")
def get_feedback(admin: dict = Depends(get_current_admin)):
    return {"success": True, "feedback": admin_operations_store.get_all("feedback")}


@app.post("/api/feedback")
def submit_feedback(request: FeedbackRequest, user: dict = Depends(get_current_user)):
    return {"success": True, "feedback": admin_operations_store.add_feedback(user, request.rating, request.comment)}


@app.get("/api/admin/dataset-versions")
def get_dataset_versions(admin: dict = Depends(get_current_admin)):
    return {"success": True, "versions": admin_operations_store.get_all("dataset_versions")}


@app.post("/api/admin/dataset-versions")
def add_dataset_version(request: DatasetVersionRequest, admin: dict = Depends(get_current_admin)):
    return {"success": True, "version": admin_operations_store.add_dataset_version(admin, request.name, request.source, request.notes)}


# ============================================================
# INTERACTIVE AI CHAT ASSISTANT
# ============================================================

@app.post("/api/ai/chat", response_model=AIChatResponse)
def ai_chat(request: AIChatRequest, user: Optional[dict] = Depends(get_optional_user)):
    provider = (request.provider or "auto").lower()
    role = user.get("role", "farmer") if user else "farmer"
    lang = request.language or "English"

    msg_dicts = [{"sender": m.sender, "text": m.text} for m in request.messages]

    # Try Gemini first if auto/gemini
    if provider in ["gemini", "auto"] and gemini_service and gemini_service.api_key:
        try:
            reply = gemini_service.chat_assistant(msg_dicts, role=role, language=lang)
            return AIChatResponse(success=True, reply=reply, provider_used="Google Gemini 3.8 Flash")
        except Exception as e:
            print(f"Gemini Chat failed: {e}")

    # Fallback to Groq
    if provider in ["groq", "auto"] and groq_service:
        try:
            reply = groq_service.chat_assistant(msg_dicts, role=role, language=lang)
            return AIChatResponse(success=True, reply=reply, provider_used="Groq LLaMA 3.3 70B")
        except Exception as e:
            print(f"Groq Chat failed: {e}")

    return AIChatResponse(
        success=False,
        reply="Sorry, the AI Assistant services (Groq and Gemini) are currently unavailable. Please try again later.",
        provider_used="None"
    )


# ============================================================
# DYNAMIC AI REPORT TRANSLATION
# ============================================================

def generate_localized_fallback_report(crop, state, district, year, predicted_yield, area, previous_yield, language="English"):
    yield_acre = predicted_yield / 2.471
    bags_acre = yield_acre / 50.0

    if language == "Telugu":
        return f"""### 📊 పంట దిగుబడి అంచనా సారాంశం

- **పంట**: {crop}
- **ప్రాంతం**: {district}, {state}
- **అంచనా సంవత్సరం**: {year}
- **సాగు విస్తీర్ణం**: {area} హెక్టార్లు
- **గత సంవత్సరం దిగుబడి**: {previous_yield} Kg/ha
- **అధికారిక XGBoost అంచనా దిగుబడి**: {predicted_yield:.2f} Kg/ha

### 🌾 రైతులకు సరళమైన వివరణ & లెక్కలు
- **ఎకరానికి అంచనా దిగుబడి**: ~ {yield_acre:.1f} కిలోలు / ఎకరా
- **ఎకరానికి అంచనా సంచులు**: ~ {bags_acre:.1f} సంచులు (50 కిలోల బస్తాలు) / ఎకరా
- **వివరణ**: మీ పొలంలో వాతావరణం మరియు మట్టి పరిస్థితుల ఆధారంగా మంచి పంట సాధించవచ్చు.

### 🌱 నిపుణుల ఉచిత సలహాలు
1. విత్తనాలు వేయడానికి ముందు నేల సారాన్ని పరీక్షించండి.
2. పంట కీలక ఎదుగుదల దశలలో వేళకు నీటిపారుదల అందించండి.
3. సిఫార్సు చేసిన మోతాదులో యూరియా మరియు DAP వాడండి.

### ⚠️ జాగ్రత్తలు
- వాతావరణ మార్పులను మరియు వర్షపాతాన్ని గమనించి నీటి సమయాన్ని సర్దుబాటు చేసుకోండి.
"""
    elif language == "Hindi":
        return f"""### 📊 फसल उपज अनुमान सारांश

- **फसल**: {crop}
- **स्थान**: {district}, {state}
- **अनुमानित वर्ष**: {year}
- **कृषि क्षेत्र**: {area} हेक्टेयर
- **पिछले वर्ष की उपज**: {previous_yield} Kg/ha
- **प्रामाणिक XGBoost अनुमानित उपज**: {predicted_yield:.2f} Kg/ha

### 🌾 किसानों के लिए सरल व्याख्या और गणना
- **प्रति एकड़ अनुमानित उपज**: ~ {yield_acre:.1f} किग्रा / एकड़
- **प्रति एकड़ अनुमानित बोरी**: ~ {bags_acre:.1f} बोरी (50 किग्रा) / एकड़
- **व्याख्या**: आपकी भूमि पर मौसम एवं मृदा स्थितियों के अनुसार अच्छी उपज मिलने की संभावना है।

### 🌱 किसानों के लिए व्यावहारिक सुझाव
1. बुआई से पहले मिट्टी परीक्षण कराएं और संतुलित मात्रा में खाद डालें।
2. फसल के विकास के मुख्य चरणों में समय पर सिंचाई करें।
3. यूरिया और डीएपी का उचित अनुपात में प्रयोग करें।

### ⚠️ सावधानियां
- मौसम पूर्वानुमान पर ध्यान दें और बारिश के अनुसार सिंचाई का प्रबंधन करें।
"""
    elif language == "Tamil":
        return f"""### 📊 பயிர் மகசூல் கணிப்பு சுருக்கம்

- **பயிர்**: {crop}
- **இடம்**: {district}, {state}
- **கணிப்பு ஆண்டு**: {year}
- **பரப்பளவு**: {area} ஹெக்டேர்
- **கடந்த ஆண்டு மகசூல்**: {previous_yield} Kg/ha
- **பிரமாண XGBoost கணித்த மகசூல்**: {predicted_yield:.2f} Kg/ha

### 🌾 விவசாயிகளுக்கான எளிய விளக்கம்
- **ஏக்கருக்கு கணித்த மகசூல்**: ~ {yield_acre:.1f} கிலோ / ஏக்கர்
- **ஏக்கருக்கு மூட்டைகள்**: ~ {bags_acre:.1f} மூட்டைகள் (50 கிலோ) / ஏக்கர்

### 🌱 விவசாயிகளுக்கான ஆலோசனைகள்
1. விதைப்பதற்கு முன் மண் பரிசோதனை செய்யவும்.
2. சரியான நேரத்தில் நீர்ப்பாசனம் செய்யவும்.
"""
    elif language == "Kannada":
        return f"""### 📊 ಬೆಳೆ ಇಳುವರಿ ಅಂದಾಜು ಸಾರಾಂಶ

- **ಬೆಳೆ**: {crop}
- **ಸ್ಥಳ**: {district}, {state}
- **ಅಂದಾಜು ವರ್ಷ**: {year}
- **ವಿಸ್ತೀರ್ಣ**: {area} ಹೆಕ್ಟೇರ್
- **ಕಳೆದ ವರ್ಷದ ಇಳುವರಿ**: {previous_yield} Kg/ha
- **ಪ್ರಮಾಣಿಕ XGBoost ಅಂದಾಜು ಇಳುವರಿ**: {predicted_yield:.2f} Kg/ha

### 🌾 ರೈತರಿಗೆ ಸರಳ ವಿವರಣೆ
- **ಪ್ರತಿ ಎಕರೆಗೆ ಇಳುವರಿ**: ~ {yield_acre:.1f} ಕೆಜಿ / ಎಕರೆ
- **ಪ್ರತಿ ಎಕರೆಗೆ ಚೀಲಗಳು**: ~ {bags_acre:.1f} ಚೀಲಗಳು (50ಕೆಜಿ) / ಎಕರೆ

### 🌱 ರೈತರಿಗೆ ಸಲಹೆಗಳು
1. ಬಿತ್ತನೆಗೆ ಮುನ್ನ ಮಣ್ಣಿನ ಪರೀಕ್ಷೆ ಮಾಡಿಸಿ.
2. ಸರಿಯಾದ ಸಮಯಕ್ಕೆ ನೀರಾವರಿ ಮಾಡಿ.
"""
    elif language == "Malayalam":
        return f"""### 📊 വിളവ് പ്രവചന സംഗ്രഹം

- **വിള**: {crop}
- **സ്ഥലം**: {district}, {state}
- **പ്രവചന വർഷം**: {year}
- **വിസ്തൃതി**: {area} ഹെക്ടർ
- **കഴിഞ്ഞ വർഷത്തെ വിളവ്**: {previous_yield} Kg/ha
- **XGBoost പ്രവചിച്ച വിളവ്**: {predicted_yield:.2f} Kg/ha

### 🌾 കർഷകർക്കായുള്ള വിവരണം
- **ഏക്കറിന് പ്രതീക്ഷിക്കുന്ന വിളവ്**: ~ {yield_acre:.1f} കി.ഗ്രാം / ഏക്കർ
- **ഏക്കറിന് ചാക്കുകൾ**: ~ {bags_acre:.1f} ചാക്കുകൾ (50കി.ഗ്രാം) / ഏക്കർ
"""
    elif language == "Marathi":
        return f"""### 📊 पीक उत्पन्न अंदाज सारांश

- **पीक**: {crop}
- **ठिकाण**: {district}, {state}
- **अंदाज वर्ष**: {year}
- **क्षेत्रफळ**: {area} हेक्टर
- **मागील वर्षाचे उत्पन्न**: {previous_yield} Kg/ha
- **XGBoost अंदाज उत्पन्न**: {predicted_yield:.2f} Kg/ha

### 🌾 शेतकऱ्यांसाठी सोपे स्पष्टीकरण
- **प्रति एकर अंदाज उत्पन्न**: ~ {yield_acre:.1f} किग्रॅ / एकर
- **प्रति एकर पोते**: ~ {bags_acre:.1f} पोते (50किग्रॅ) / एकर
"""
    else:
        return f"""### 📊 Yield Prediction Summary

- **Crop**: {crop}
- **Location**: {district}, {state}
- **Prediction Year**: {year}
- **Cultivated Area**: {area} ha
- **Previous Year Yield**: {previous_yield} Kg/ha
- **Authoritative XGBoost Predicted Yield**: {predicted_yield:.2f} Kg/ha

### 🌾 Simple Farmer Explanation & Bags/Acre
- **Estimated Yield per Acre**: ~ {yield_acre:.1f} Kg / acre
- **Estimated 50kg Bags per Acre**: ~ {bags_acre:.1f} bags / acre
- **What this means**: Based on soil and climate conditions, your farm is projected to yield well under standard management practices.

### 🌱 Practical Farmer Action Plan
1. Test soil NPK balance prior to seed sowing.
2. Ensure timely irrigation during flowering and pod development stages.
3. Apply balanced Urea and DAP fertilizers as per crop recommendations.

### ⚠️ Key Risks & Mitigation
- Monitor local rainfall forecasts and adjust irrigation schedules accordingly.
"""


@app.post("/api/ai/translate", response_model=TranslateResponse)
def translate_report(req: TranslateRequest):
    target_lang = req.target_language or "English"
    if target_lang.lower() in ["en", "english"] or not req.text.strip():
        return TranslateResponse(
            success=True,
            translated_text=req.text,
            target_language=target_lang,
            provider_used="Original"
        )

    # 1. Try Gemini
    if gemini_service and gemini_service.api_key:
        try:
            translated = gemini_service.translate_text(req.text, target_lang)
            if translated and len(translated.strip()) > 10:
                return TranslateResponse(
                    success=True,
                    translated_text=translated,
                    target_language=target_lang,
                    provider_used="Google Gemini 3.8"
                )
        except Exception as e:
            print(f"Gemini translation failed: {e}")

    # 2. Try Groq
    if groq_service:
        try:
            translated = groq_service.translate_text(req.text, target_lang)
            if translated and len(translated.strip()) > 10:
                return TranslateResponse(
                    success=True,
                    translated_text=translated,
                    target_language=target_lang,
                    provider_used="Groq LLaMA 3.3"
                )
        except Exception as e:
            print(f"Groq translation failed: {e}")

    # 3. Smart Fallback Header Translator if AI is offline
    header_replacements = {
        "Telugu": {
            "Yield Prediction Summary": "పంట దిగుబడి అంచనా సారాంశం",
            "Simple Explanation & Farmer Conversion": "రైతులకు సరళమైన వివరణ & సంచుల లెక్కలు",
            "Prediction Interpretation": "దిగుబడి విశ్లేషణ",
            "Practical Farmer Action Plan": "రైతుల కోసం ఆచరణాత్మక కార్యాచరణ ప్రణాళిక",
            "Risk Assessment & Simple Prevention": "ప్రమాదాలు & నివారణ చిట్కాలు",
            "Crop:": "పంట:",
            "Location:": "ప్రాంతం:",
            "Prediction Year:": "అంచనా సంవత్సరం:",
            "Cultivated Area:": "సాగు విస్తీర్ణం:",
            "Authoritative XGBoost Predicted Yield": "అధికారిక XGBoost అంచనా దిగుబడి"
        },
        "Hindi": {
            "Yield Prediction Summary": "फसल उपज अनुमान सारांश",
            "Simple Explanation & Farmer Conversion": "किसानों के लिए सरल व्याख्या और बोरी गणना",
            "Prediction Interpretation": "उपज व्याख्या एवं विश्लेषण",
            "Practical Farmer Action Plan": "किसानों के लिए व्यावहारिक कार्य योजना",
            "Risk Assessment & Simple Prevention": "जोखिम और बचाव के उपाय",
            "Crop:": "फसल:",
            "Location:": "स्थान:",
            "Prediction Year:": "अनुमानित वर्ष:",
            "Cultivated Area:": "कृषि क्षेत्र:",
            "Authoritative XGBoost Predicted Yield": "प्रामाणिक XGBoost अनुमानित उपज"
        }
    }

    translated_text = req.text
    if target_lang in header_replacements:
        for en_key, tr_val in header_replacements[target_lang].items():
            translated_text = translated_text.replace(en_key, tr_val)

    return TranslateResponse(
        success=True,
        translated_text=translated_text,
        target_language=target_lang,
        provider_used="Fallback Translator"
    )


# ============================================================
# NEW ENHANCEMENT ENDPOINTS
# ============================================================

@app.get("/api/weather/forecast", response_model=WeatherForecastResponse)
def get_weather_forecast(state: str = "Punjab", district: str = "Ludhiana", crop: Optional[str] = None):
    return enhancement_service.get_weather_forecast(state, district, crop)


@app.get("/api/crop/planting-advice/{crop}")
def get_crop_planting_advice(crop: str):
    return {"success": True, "advice": enhancement_service.get_planting_advice(crop)}


@app.post("/api/fertilizer/recommend", response_model=FertilizerResponse)
def recommend_fertilizer(req: FertilizerRequest):
    return enhancement_service.calculate_fertilizer(
        crop=req.Crop,
        target_yield=req.target_yield,
        nitrogen=req.nitrogen_level,
        phosphorus=req.phosphorus_level,
        potassium=req.potassium_level,
        ph=req.ph_level,
        soil_type=req.soil_type
    )


@app.post("/api/crops/compare", response_model=MultiCropCompareResponse)
def compare_multi_crops(req: MultiCropCompareRequest):
    comparisons = []
    for crop in req.crops:
        try:
            pred_yield = float(predictor.predict(
                Year=req.Year,
                State_Name=req.State_Name,
                Dist_Name=req.Dist_Name,
                Crop=crop,
                Area=req.Area,
                Previous_Year_Yield=req.Previous_Year_Yield,
                Previous_Year_Area=req.Previous_Year_Area,
                Previous_Year_Production=req.Previous_Year_Production
            ))
        except Exception as e:
            print(f"Prediction warning for crop {crop}: {e}")
            pred_yield = 2000.0

        est_prod = pred_yield * req.Area

        crop_info = CROP_AGRO_DATABASE.get(crop.upper(), CROP_AGRO_DATABASE["DEFAULT"])
        price = crop_info["price_per_kg"]
        cost_ha = crop_info["cost_per_ha"]

        gross_rev = est_prod * price
        total_cost = cost_ha * req.Area
        net_profit = gross_rev - total_cost
        roi = ((net_profit / total_cost) * 100.0) if total_cost > 0 else 0.0

        risk = "Low" if roi > 30 else ("Moderate" if roi > 0 else "High Risk")

        comparisons.append(CropComparisonItem(
            crop=crop,
            predicted_yield=round(pred_yield, 2),
            estimated_production=round(est_prod, 2),
            gross_revenue_inr=round(gross_rev, 2),
            estimated_cost_inr=round(total_cost, 2),
            net_profit_inr=round(net_profit, 2),
            roi_percentage=round(roi, 1),
            risk_level=risk
        ))

    comparisons.sort(key=lambda x: x.net_profit_inr, reverse=True)
    best_crop = comparisons[0].crop if comparisons else (req.crops[0] if req.crops else "Crop")

    ai_rec = f"Based on ML predictions in {req.Dist_Name}, {req.State_Name}, {best_crop} offers the highest projected return of ₹{comparisons[0].net_profit_inr:,.0f}/ha."

    return MultiCropCompareResponse(
        state=req.State_Name,
        district=req.Dist_Name,
        year=req.Year,
        area=req.Area,
        best_crop=best_crop,
        comparisons=comparisons,
        ai_recommendation=ai_rec
    )


@app.post("/api/pest-risk/analyze", response_model=PestRiskResponse)
def analyze_pest_risk(req: PestRiskRequest):
    return enhancement_service.analyze_pest_risk(
        crop=req.Crop,
        temp=req.temperature_c,
        humidity=req.humidity_pct,
        rainfall=req.rainfall_mm
    )


# ============================================================
# TRANSLATION ENDPOINT
# ============================================================

@app.post("/api/translate", response_model=TranslateResponse)
def translate_text(req: TranslateRequest):
    """
    Translate text to the target language using AI services.
    Used for dynamic translation of AI-generated agronomy reports.
    """
    from .schemas import TranslateRequest, TranslateResponse
    
    text = req.text
    target_lang = req.target_language or "English"
    provider = (req.provider or "auto").lower()
    
    # Try Gemini first
    if provider in ["gemini", "auto"] and gemini_service and gemini_service.api_key:
        try:
            translated = gemini_service.translate_text(text, target_lang)
            if translated:
                return TranslateResponse(
                    success=True,
                    translated_text=translated,
                    target_language=target_lang,
                    provider_used="Google Gemini"
                )
        except Exception as e:
            print(f"Gemini translation failed: {e}")
    
    # Fallback to Groq
    if provider in ["groq", "auto"] and groq_service:
        try:
            translated = groq_service.translate_text(text, target_lang)
            if translated:
                return TranslateResponse(
                    success=True,
                    translated_text=translated,
                    target_language=target_lang,
                    provider_used="Groq LLaMA"
                )
        except Exception as e:
            print(f"Groq translation failed: {e}")
    
    # If all AI services fail, return original text with warning
    return TranslateResponse(
        success=False,
        translated_text=text,
        target_language=target_lang,
        provider_used="None (fallback)"
    )
