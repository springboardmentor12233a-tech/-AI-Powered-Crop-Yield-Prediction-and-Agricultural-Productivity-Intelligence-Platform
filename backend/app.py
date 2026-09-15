from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .dataset_service import DatasetService
from .groq_service import GroqService
from .predictor import YieldPredictor
from .schemas import PredictionRequest, PredictionResponse

app = FastAPI(
    title="AgriYield AI",
    description="AI-powered agricultural crop yield prediction system",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# SERVICES
# ============================================================

predictor = YieldPredictor()
groq_service = GroqService()
dataset_service = DatasetService()


# ============================================================
# BASIC ENDPOINTS
# ============================================================

@app.get("/")
def home():
    return {
        "message": "AgriYield AI Backend Running",
        "version": "1.0.0"
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "message": "Backend running",
        "model": "XGBoost",
        "ai": "Groq"
    }


# ============================================================
# PREDICTION + AI ANALYSIS
# ============================================================

@app.post(
    "/api/predict",
    response_model=PredictionResponse
)
def predict(request: PredictionRequest):

    try:

        # ----------------------------------------------------
        # 1. VALIDATE STATE
        # ----------------------------------------------------

        states = dataset_service.get_states()

        if request.State_Name not in states:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid state: '{request.State_Name}'"
            )


        # ----------------------------------------------------
        # 2. VALIDATE DISTRICT
        # ----------------------------------------------------

        districts = dataset_service.get_districts(
            request.State_Name
        )

        if request.Dist_Name not in districts:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"District '{request.Dist_Name}' does not "
                    f"belong to state '{request.State_Name}'."
                )
            )


        # ----------------------------------------------------
        # 3. VALIDATE CROP
        # ----------------------------------------------------

        crops = dataset_service.get_crops()

        if request.Crop not in crops:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid crop: '{request.Crop}'"
            )


        # ----------------------------------------------------
        # 4. VALIDATE YEAR
        # ----------------------------------------------------

        years = dataset_service.get_years()

        if request.Year not in years:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid year: {request.Year}"
            )


        # ----------------------------------------------------
        # 5. XGBOOST PREDICTION
        # ----------------------------------------------------

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


        # ----------------------------------------------------
        # 6. GROQ AI ANALYSIS
        # ----------------------------------------------------

        ai_analysis = groq_service.analyze_prediction(
            year=request.Year,
            state_name=request.State_Name,
            district_name=request.Dist_Name,
            crop=request.Crop,
            area=request.Area,
            previous_yield=request.Previous_Year_Yield,
            previous_area=request.Previous_Year_Area,
            previous_production=request.Previous_Year_Production,
            predicted_yield=predicted_yield
        )


        # ----------------------------------------------------
        # 7. COMBINED RESPONSE
        # ----------------------------------------------------

        return PredictionResponse(
            success=True,
            Year=request.Year,
            State_Name=request.State_Name,
            Dist_Name=request.Dist_Name,
            Crop=request.Crop,
            predicted_yield=predicted_yield,
            unit="Kg per ha",
            model="XGBoost",
            ai_analysis=ai_analysis
        )


    except HTTPException:
        # Keep our intentional 400 errors
        raise


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )
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