"""
YieldSense AI — Crop Doctor Route (AI Crop Disease & Pest Diagnosis)
Endpoints:
- POST /crop-doctor/analyze  — Vision AI model crop image analysis
- GET /crop-doctor/history  — History of user's past diagnoses
- GET /crop-doctor/history/{id} — Detailed past diagnosis record
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
import base64
import json
import os, sys, logging

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from auth_utils import get_current_user
from config import get_settings
from db.database import get_db, CropDiagnosis
from models.schemas import CropDiagnosisResponse, CropDiagnosisHistoryItem

logger = logging.getLogger("yieldsense")
router = APIRouter(prefix="/crop-doctor", tags=["Crop Doctor AI"])
settings = get_settings()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/analyze", response_model=CropDiagnosisResponse)
async def analyze_crop_image(
    file: UploadFile = File(...),
    crop_type: Optional[str] = Form(None),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze an uploaded leaf/crop image for diseases, nutrient deficiencies, or pest damage
    using Groq Vision AI (llama-3.2-11b-vision-preview).
    """
    # 1. Validate File Type
    if file.content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file.content_type}'. Please upload a JPEG, PNG, or WebP image."
        )

    # 2. Read Image Data & Validate File Size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds the 10 MB limit. Please upload a smaller image."
        )

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # 3. Check Groq API Key
    api_key = settings.GROQ_API_KEY.strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="AI Crop Diagnosis service is currently unavailable. GROQ_API_KEY environment variable is not configured."
        )

    base64_image = base64.b64encode(contents).decode("utf-8")
    mime_type = file.content_type.lower()

    # 4. Construct Vision AI Prompt
    crop_hint = f" The farmer indicates this crop is likely: {crop_type}." if crop_type else ""
    prompt_text = f"""You are an expert agricultural plant pathologist and agronomist.{crop_hint}

Examine the provided image of the plant leaf or crop carefully for symptoms of diseases, pests, fungal infections, or nutritional deficiencies.

You MUST respond ONLY with a valid, clean JSON object (no markdown codeblock formatting, no extra text) conforming to the following structure:

{{
  "crop_identified": "Name of the crop identified or estimated (e.g., Tomato, Wheat, Maize)",
  "symptoms": ["List of distinct visual symptoms observed on leaves/stem/fruit"],
  "diagnosis": "Primary diagnosed disease, pest issue, deficiency, or Healthy Crop status",
  "confidence_level": "High", "Medium", "Low", or "Uncertain",
  "visual_evidence": ["Key visual cues supporting this diagnosis"],
  "alternative_explanations": ["Possible alternative conditions or diseases if confidence is not High"],
  "immediate_actions": ["Clear, step-by-step immediate treatment or corrective steps for the farmer"],
  "prevention_and_monitoring": ["Long-term prevention, soil management, and ongoing monitoring tips"],
  "expert_inspection_needed": true or false
}}
"""

    # 5. Call Groq Vision API
    try:
        from groq import Groq
        client = Groq(api_key=api_key)

        model_name = "qwen/qwen3.8-27b"
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt_text},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            model=model_name,
            max_tokens=1024,
            temperature=0.2,
        )

        response_text = chat_completion.choices[0].message.content.strip()

        # Sanitize Markdown formatting if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            response_text = "\n".join(lines).strip()

        parsed_data = json.loads(response_text)

    except json.JSONDecodeError:
        logger.error(f"Failed to parse Groq response as JSON. Output was: {response_text}")
        raise HTTPException(
            status_code=502,
            detail="AI model returned invalid diagnostic structure. Please try uploading a clearer image."
        )
    except Exception as e:
        logger.error(f"Groq Vision API call failed: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"AI Crop Doctor service error: {str(e)}"
        )

    # 6. Extract Fields
    crop_identified = parsed_data.get("crop_identified", crop_type or "Unknown Crop")
    symptoms = parsed_data.get("symptoms", [])
    diagnosis = parsed_data.get("diagnosis", "Unspecified Diagnosis")
    confidence_level = parsed_data.get("confidence_level", "Medium")
    visual_evidence = parsed_data.get("visual_evidence", [])
    alternative_explanations = parsed_data.get("alternative_explanations", [])
    immediate_actions = parsed_data.get("immediate_actions", [])
    prevention_and_monitoring = parsed_data.get("prevention_and_monitoring", [])
    expert_inspection_needed = bool(parsed_data.get("expert_inspection_needed", False))

    # 7. Save Record to Database
    symptoms_str = "; ".join(symptoms) if symptoms else None
    actions_str = "; ".join(immediate_actions) if immediate_actions else None

    db_item = CropDiagnosis(
        user_id=current_user.id,
        crop_type=crop_identified,
        diagnosis=diagnosis,
        confidence_level=confidence_level,
        symptoms_summary=symptoms_str,
        recommended_actions=actions_str,
        image_filename=file.filename
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    return CropDiagnosisResponse(
        crop_identified=crop_identified,
        symptoms=symptoms,
        diagnosis=diagnosis,
        confidence_level=confidence_level,
        visual_evidence=visual_evidence,
        alternative_explanations=alternative_explanations,
        immediate_actions=immediate_actions,
        prevention_and_monitoring=prevention_and_monitoring,
        expert_inspection_needed=expert_inspection_needed,
        disclaimer=(
            "AI Crop Doctor diagnosis is generated by visual AI analysis for decision support. "
            "For severe crop disease outbreaks or major chemical application, consult a local agricultural extension officer."
        ),
        provider="Groq Vision AI",
        model=model_name,
        history_id=db_item.id
    )


@router.get("/history", response_model=List[CropDiagnosisHistoryItem])
def get_diagnosis_history(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch diagnosis history for the logged-in user.
    """
    items = (
        db.query(CropDiagnosis)
        .filter(CropDiagnosis.user_id == current_user.id)
        .order_by(CropDiagnosis.created_at.desc())
        .all()
    )
    return items


@router.get("/history/{history_id}", response_model=CropDiagnosisHistoryItem)
def get_diagnosis_item(
    history_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch a single diagnosis history record by ID.
    """
    item = (
        db.query(CropDiagnosis)
        .filter(CropDiagnosis.id == history_id, CropDiagnosis.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Diagnosis record not found.")
    return item
