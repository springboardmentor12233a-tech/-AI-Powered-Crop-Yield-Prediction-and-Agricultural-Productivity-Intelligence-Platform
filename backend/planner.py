"""
Farm Planner.

GET  /planner/defaults   (JWT, farmers only)
    Placeholder price / cost per crop. The farmer edits them in the UI.

POST /planner            (JWT, farmers only)
    Body: { "profile_id": int,
            "previous_crop": str | null,         (defaults to the saved field's crop)
            "prices": { "Wheat": 22750, ... },   (Rs per tonne, optional)
            "costs":  { "Wheat": 35000, ... } }  (Rs per hectare, optional)

For the chosen saved field it predicts the yield of EVERY crop in EVERY season
with the same XGBoost model used on the Predict page (using the field's own
region and soil values, and typical weather / inputs from the dataset), turns
that into an expected profit, and ranks the crops.

POST /planner/timeline   (JWT, farmers only)
    Body: { "profile_id": int, "crop_type": str, "sowing_date": "YYYY-MM-DD",
            "previous_crop": str | null }
    Returns a dated activity timeline (land preparation to harvest) for that crop,
    with warnings on the steps your field's soil values affect.

Honest limits (also shown in the UI):
  - Prices and costs are editable placeholders, not live market data.
  - Crop rotation is simple rule-based advice. The model does not know the
    previous crop, so rotation only affects the ranking order, not the yield.
"""

from datetime import datetime, timedelta

import pandas as pd
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from auth import role_required
from models import FarmProfile
import predict_service as ps

planner_bp = Blueprint("planner", __name__)

SEASONS = ["Spring", "Summer", "Autumn"]
SEASON_FALLBACK_MONTH = {"Spring": 5, "Summer": 8, "Autumn": 11}

# PLACEHOLDER numbers (roughly Indian support prices / typical costs). Replace
# them with local prices in the UI. They are NOT live market data.
DEFAULT_PRICE_PER_TONNE = {"Wheat": 22750, "Corn": 22250, "Rice": 23000, "Soybean": 48900, "Barley": 18500}
DEFAULT_COST_PER_HA = {"Wheat": 35000, "Corn": 40000, "Rice": 50000, "Soybean": 30000, "Barley": 30000}
FALLBACK_PRICE = 20000
FALLBACK_COST = 35000

LEGUMES = {"Soybean"}
CEREALS = {"Wheat", "Corn", "Rice", "Barley"}

# General crop calendars used by the timeline. Each step is an offset in days from
# the start date (day 0). This is general guidance, NOT from your dataset: real
# timing depends on the variety, weather and region. "params" lists the soil
# values that affect a step, so it can show a warning if that value is off.
CROP_CALENDAR = {
    "Wheat": {
        "duration_days": 130,
        "start_label": "Sowing date",
        "steps": [
            {"day": -14, "title": "Prepare the land", "detail": "Plough and level the field and mix in organic manure or compost.", "params": ["Soil pH", "Phosphorus", "Potassium"]},
            {"day": 0, "title": "Sow the seed", "detail": "Sow treated seed in lines at an even depth."},
            {"day": 21, "title": "First irrigation", "detail": "Irrigate at the crown root stage, which is a key stage for wheat."},
            {"day": 30, "title": "Nitrogen top-up and weeding", "detail": "Apply the first split of nitrogen and remove weeds.", "params": ["Nitrogen"]},
            {"day": 45, "title": "Second irrigation", "detail": "Irrigate again and weed if needed."},
            {"day": 65, "title": "Check for pests and disease", "detail": "Look for rust, aphids and yellowing leaves. Act early if you see them."},
            {"day": 80, "title": "Irrigate at flowering", "detail": "Do not let the field dry out while the ears are forming."},
            {"day": 100, "title": "Irrigate at grain filling", "detail": "One more irrigation helps the grains fill well."},
            {"day": 122, "title": "Stop irrigation", "detail": "Let the crop dry down and check how hard the grains are."},
            {"day": 130, "title": "Harvest", "detail": "Harvest when the grains are hard and the straw is golden."},
        ],
    },
    "Corn": {
        "duration_days": 100,
        "start_label": "Sowing date",
        "steps": [
            {"day": -14, "title": "Prepare the land", "detail": "Plough, level and add organic manure. Make sure the field drains well.", "params": ["Soil pH", "Phosphorus", "Potassium"]},
            {"day": 0, "title": "Sow the seed", "detail": "Sow seeds in rows with enough space between plants."},
            {"day": 10, "title": "Fill gaps and first irrigation", "detail": "Replant any gaps and give a light irrigation."},
            {"day": 20, "title": "Weeding and first nitrogen", "detail": "Remove weeds and apply the first split of nitrogen.", "params": ["Nitrogen"]},
            {"day": 35, "title": "Earthing up and second nitrogen", "detail": "Pile soil around the plant base and apply the second split of nitrogen.", "params": ["Nitrogen"]},
            {"day": 45, "title": "Check for pests", "detail": "Look for stem borer and armyworm in the leaf whorls."},
            {"day": 60, "title": "Irrigate at tasselling", "detail": "This is the most critical stage for water in maize."},
            {"day": 90, "title": "Stop irrigation", "detail": "Let the cobs mature and dry."},
            {"day": 100, "title": "Harvest", "detail": "Harvest when the husks are dry and the grains are hard."},
        ],
    },
    "Rice": {
        "duration_days": 120,
        "start_label": "Transplanting date",
        "steps": [
            {"day": -25, "title": "Sow the nursery", "detail": "Sow seed in a nursery bed about 25 days before transplanting."},
            {"day": -14, "title": "Prepare the field", "detail": "Plough and add organic manure.", "params": ["Soil pH", "Phosphorus", "Potassium"]},
            {"day": -3, "title": "Puddle and level", "detail": "Flood, puddle and level the field."},
            {"day": 0, "title": "Transplant the seedlings", "detail": "Transplant healthy seedlings and keep a thin layer of water."},
            {"day": 10, "title": "First nitrogen", "detail": "Apply the first split of nitrogen.", "params": ["Nitrogen"]},
            {"day": 25, "title": "Weeding", "detail": "Remove weeds by hand or with a weeder."},
            {"day": 35, "title": "Second nitrogen", "detail": "Apply the second split of nitrogen.", "params": ["Nitrogen"]},
            {"day": 50, "title": "Check for pests and disease", "detail": "Look for stem borer, planthopper and leaf blast."},
            {"day": 65, "title": "Keep water in the field", "detail": "Water is very important when the panicles are forming."},
            {"day": 85, "title": "Flowering", "detail": "Do not let the field dry out during flowering."},
            {"day": 110, "title": "Drain the field", "detail": "Drain the water about 10 days before harvest."},
            {"day": 120, "title": "Harvest", "detail": "Harvest when most of the grains have turned straw-coloured."},
        ],
    },
    "Soybean": {
        "duration_days": 100,
        "start_label": "Sowing date",
        "steps": [
            {"day": -14, "title": "Prepare the land", "detail": "Plough and level. Make sure water does not stand in the field.", "params": ["Soil pH", "Phosphorus", "Potassium"]},
            {"day": 0, "title": "Sow the seed", "detail": "Treat the seed with rhizobium culture, which helps the plants fix nitrogen, then sow in rows."},
            {"day": 15, "title": "Thin plants and weed", "detail": "Thin crowded plants and remove weeds."},
            {"day": 30, "title": "Second weeding", "detail": "Weed again before the plants close up."},
            {"day": 38, "title": "Check for pests", "detail": "Look for girdle beetle and leaf-eating caterpillars."},
            {"day": 50, "title": "Irrigate at flowering", "detail": "Irrigate if the weather is dry."},
            {"day": 65, "title": "Irrigate at pod formation", "detail": "Water stress now reduces the number of pods."},
            {"day": 88, "title": "Stop irrigation", "detail": "Let the pods mature."},
            {"day": 100, "title": "Harvest", "detail": "Harvest when most of the pods are yellow-brown and the leaves have dropped."},
        ],
    },
    "Barley": {
        "duration_days": 120,
        "start_label": "Sowing date",
        "steps": [
            {"day": -14, "title": "Prepare the land", "detail": "Plough, level and mix in organic manure.", "params": ["Soil pH", "Phosphorus", "Potassium"]},
            {"day": 0, "title": "Sow the seed", "detail": "Sow treated seed in lines."},
            {"day": 25, "title": "First irrigation", "detail": "Irrigate at the crown root stage."},
            {"day": 30, "title": "Nitrogen top-up and weeding", "detail": "Apply nitrogen and remove weeds.", "params": ["Nitrogen"]},
            {"day": 55, "title": "Second irrigation", "detail": "Irrigate again."},
            {"day": 70, "title": "Check for pests and disease", "detail": "Look for aphids, rust and smut."},
            {"day": 90, "title": "Irrigate at flowering", "detail": "Keep the soil moist while the grains form."},
            {"day": 112, "title": "Stop irrigation", "detail": "Let the crop dry down."},
            {"day": 120, "title": "Harvest", "detail": "Harvest when the ears are dry and the grains are hard."},
        ],
    },
}

GENERIC_CALENDAR = {
    "duration_days": 120,
    "start_label": "Sowing date",
    "steps": [
        {"day": -14, "title": "Prepare the land", "detail": "Plough, level and add organic manure.", "params": ["Soil pH", "Phosphorus", "Potassium"]},
        {"day": 0, "title": "Sow the seed", "detail": "Sow good-quality seed at the right depth."},
        {"day": 30, "title": "Weeding and top-up", "detail": "Remove weeds and top up nutrients if needed.", "params": ["Nitrogen"]},
        {"day": 60, "title": "Check for pests and disease", "detail": "Walk the field and look for damage."},
        {"day": 120, "title": "Harvest", "detail": "Harvest when the crop is mature."},
    ],
}

SOIL_LABELS = {
    "soil_ph": "Soil pH",
    "nitrogen_content": "Nitrogen",
    "phosphorus_content": "Phosphorus",
    "potassium_content": "Potassium",
}

# Training data, used only to get typical values for inputs the saved field
# does not store (moisture, fertilizer, sunlight...).
_train = pd.read_csv(ps.TRAIN_PROCESSED_PATH)


def _median(col, fallback):
    try:
        v = float(_train[col].median())
        return v if v == v else fallback  # v == v is False for NaN
    except Exception:
        return fallback


_DEFAULTS = {
    "soil_ph": _median("soil_ph", 6.5),
    "nitrogen_content": _median("nitrogen_content", 1.5),
    "phosphorus_content": _median("phosphorus_content", 1.0),
    "potassium_content": _median("potassium_content", 1.2),
    "soil_moisture": _median("soil_moisture", 30.0),
    "avg_temperature": _median("avg_temperature", 25.0),
    "total_rainfall": _median("total_rainfall", 600.0),
    "fertilizer_amount": _median("fertilizer_amount", 150.0),
    "pesticide_usage": _median("pesticide_usage", 8.0),
    "sunlight_hours": _median("sunlight_hours", 2000.0),
    "irrigation_frequency": round(_median("irrigation_frequency", 3)),
}


def _harvest_month(season):
    """Most typical harvest month for a season in the dataset."""
    try:
        m = _train.loc[_train[f"season_{season}"] == 1, "harvest_month"].median()
        if m == m:
            return int(round(m))
    except Exception:
        pass
    return SEASON_FALLBACK_MONTH[season]


_MONTHS = {s: _harvest_month(s) for s in SEASONS}


def _weather(region, season):
    ctx = ps.get_weather_context({"region": region, "season": season})
    temp = ctx.get("typical_avg_temperature")
    rain = ctx.get("typical_total_rainfall")
    return (
        temp if temp is not None else _DEFAULTS["avg_temperature"],
        rain if rain is not None else _DEFAULTS["total_rainfall"],
    )


def _soil_check(profile, crop):
    """Checks the field's saved soil values against the healthy range of `crop`."""
    issues, healthy, checked = [], 0, 0
    for col, label in SOIL_LABELS.items():
        value = getattr(profile, col)
        if value is None:
            continue
        low = float(ps._soil_ranges.loc[crop, f"{col}_low"])
        high = float(ps._soil_ranges.loc[crop, f"{col}_high"])
        checked += 1
        if value < low:
            issues.append({"parameter": label, "status": "too low", "value": value, "low": low, "high": high})
        elif value > high:
            issues.append({"parameter": label, "status": "too high", "value": value, "low": low, "high": high})
        else:
            healthy += 1
    return healthy, checked, issues


def _rotation(previous, crop):
    """Simple rule-based rotation advice. Returns (tag, note)."""
    if previous and crop == previous:
        return "avoid", (
            "Same crop as last season. Repeating it can build up pests and diseases, "
            "so rotating is usually safer."
        )
    if crop in LEGUMES and previous not in LEGUMES:
        return "good", "Soybean fixes nitrogen in the soil, which helps the crops that follow it."
    if previous in LEGUMES and crop in CEREALS:
        return "good", "Follows soybean, which leaves extra nitrogen in the soil for cereal crops."
    if previous in CEREALS and crop in CEREALS:
        return "neutral", (
            "A cereal after a cereal is acceptable, but a legume such as soybean "
            "in between is better for the soil."
        )
    return "neutral", ""


def _numbers(raw, defaults, fallback, crops):
    """Reads a {crop: number} dict from the request, falling back to defaults."""
    raw = raw if isinstance(raw, dict) else {}
    out = {}
    for crop in crops:
        default = float(defaults.get(crop, fallback))
        try:
            v = float(raw.get(crop, default))
            out[crop] = v if v >= 0 else default
        except (TypeError, ValueError):
            out[crop] = default
    return out


@planner_bp.route("/planner/defaults", methods=["GET"])
@jwt_required()
@role_required("farmer")
def planner_defaults():
    crops = list(ps._soil_ranges.index)
    return jsonify({
        "crops": [
            {
                "crop_type": c,
                "price_per_tonne": DEFAULT_PRICE_PER_TONNE.get(c, FALLBACK_PRICE),
                "cost_per_ha": DEFAULT_COST_PER_HA.get(c, FALLBACK_COST),
            }
            for c in crops
        ]
    }), 200


@planner_bp.route("/planner", methods=["POST"])
@jwt_required()
@role_required("farmer")
def plan():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json(silent=True) or {}

        try:
            profile_id = int(data.get("profile_id"))
        except (TypeError, ValueError):
            return jsonify({"error": "profile_id is required"}), 400

        profile = FarmProfile.query.filter_by(id=profile_id, user_id=user_id).first()
        if not profile:
            return jsonify({"error": "Field not found"}), 404
        if not profile.region:
            return jsonify({"error": "This field has no region saved"}), 400

        crops = list(ps._soil_ranges.index)
        previous = data.get("previous_crop") or profile.crop_type
        prices = _numbers(data.get("prices"), DEFAULT_PRICE_PER_TONNE, FALLBACK_PRICE, crops)
        costs = _numbers(data.get("costs"), DEFAULT_COST_PER_HA, FALLBACK_COST, crops)

        # Soil values come from the saved field; missing ones use dataset medians.
        soil, soil_assumed = {}, []
        for col, label in SOIL_LABELS.items():
            value = getattr(profile, col)
            if value is None:
                soil[col] = _DEFAULTS[col]
                soil_assumed.append(label)
            else:
                soil[col] = float(value)

        # One prediction per (crop, season) combination, in a single model call.
        combos, frames = [], []
        for crop in crops:
            for season in SEASONS:
                temp, rain = _weather(profile.region, season)
                field = {
                    "crop_type": crop,
                    "region": profile.region,
                    "season": season,
                    "harvest_date": f"2025-{_MONTHS[season]:02d}-15",
                    "soil_ph": soil["soil_ph"],
                    "soil_moisture": _DEFAULTS["soil_moisture"],
                    "avg_temperature": temp,
                    "total_rainfall": rain,
                    "fertilizer_amount": _DEFAULTS["fertilizer_amount"],
                    "pesticide_usage": _DEFAULTS["pesticide_usage"],
                    "sunlight_hours": _DEFAULTS["sunlight_hours"],
                    "nitrogen_content": soil["nitrogen_content"],
                    "phosphorus_content": soil["phosphorus_content"],
                    "potassium_content": soil["potassium_content"],
                    "irrigation_frequency": _DEFAULTS["irrigation_frequency"],
                }
                frames.append(ps.preprocess_input(field))
                combos.append((crop, season))

        X = pd.concat(frames, ignore_index=True)
        preds = ps._model.predict(X)

        by_crop = {}
        for (crop, season), y in zip(combos, preds):
            y = max(float(y), 0.0)
            by_crop.setdefault(crop, []).append({
                "season": season,
                "predicted_yield": round(y, 2),
                "profit_per_ha": round(y * prices[crop] - costs[crop]),
            })

        size = profile.field_size_hectares
        options = []
        for crop, seasons in by_crop.items():
            seasons.sort(key=lambda s: -s["profit_per_ha"])
            best = seasons[0]
            # If the three seasons predict (almost) the same yield, the model has no
            # real basis to prefer one, so the UI should not claim a "best season".
            yields = [s["predicted_yield"] for s in seasons]
            spread = (max(yields) - min(yields)) / max(yields) if max(yields) > 0 else 0.0
            healthy, checked, issues = _soil_check(profile, crop)
            tag, note = _rotation(previous, crop)
            options.append({
                "crop_type": crop,
                "best_season": best["season"],
                "predicted_yield": best["predicted_yield"],
                "revenue_per_ha": round(best["predicted_yield"] * prices[crop]),
                "cost_per_ha": round(costs[crop]),
                "profit_per_ha": best["profit_per_ha"],
                "total_profit": round(best["profit_per_ha"] * size) if size else None,
                "seasons": seasons,
                "season_matters": spread >= 0.01,
                "season_spread_pct": round(spread * 100, 1),
                "soil_healthy": healthy,
                "soil_checked": checked,
                "soil_issues": issues,
                "rotation": tag,
                "rotation_note": note,
            })

        # Crops that repeat last season's crop go to the bottom; otherwise by profit.
        options.sort(key=lambda o: (o["rotation"] == "avoid", -o["profit_per_ha"]))
        for i, o in enumerate(options, 1):
            o["rank"] = i

        return jsonify({
            "field": {
                "id": profile.id,
                "field_name": profile.field_name,
                "region": profile.region,
                "field_size_hectares": size,
            },
            "previous_crop": previous,
            "options": options,
            "assumptions": {
                "prices": prices,
                "costs": costs,
                "soil_assumed": soil_assumed,
            },
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@planner_bp.route("/planner/timeline", methods=["POST"])
@jwt_required()
@role_required("farmer")
def timeline():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json(silent=True) or {}

        try:
            profile_id = int(data.get("profile_id"))
        except (TypeError, ValueError):
            return jsonify({"error": "profile_id is required"}), 400
        profile = FarmProfile.query.filter_by(id=profile_id, user_id=user_id).first()
        if not profile:
            return jsonify({"error": "Field not found"}), 404

        crop = data.get("crop_type")
        if crop not in list(ps._soil_ranges.index):
            return jsonify({"error": "Unknown crop"}), 400

        try:
            start = datetime.strptime(str(data.get("sowing_date")), "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "sowing_date must look like 2026-11-15"}), 400

        calendar = CROP_CALENDAR.get(crop, GENERIC_CALENDAR)
        _, _, issues = _soil_check(profile, crop)
        issue_by_param = {i["parameter"]: i for i in issues}

        steps = []
        for s in calendar["steps"]:
            warning = None
            for param in s.get("params", []):
                issue = issue_by_param.get(param)
                if issue:
                    warning = (
                        f"{param} is {issue['status']} for {crop}. "
                        "Ask a local agricultural officer what to apply."
                    )
                    break
            steps.append({
                "day": s["day"],
                "date": (start + timedelta(days=s["day"])).isoformat(),
                "title": s["title"],
                "detail": s["detail"],
                "warning": warning,
            })

        previous = data.get("previous_crop") or profile.crop_type
        _, rotation_note = _rotation(previous, crop)

        return jsonify({
            "crop_type": crop,
            "start_label": calendar["start_label"],
            "start_date": start.isoformat(),
            "duration_days": calendar["duration_days"],
            "harvest_date": (start + timedelta(days=calendar["duration_days"])).isoformat(),
            "rotation_note": rotation_note,
            "steps": steps,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500