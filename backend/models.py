from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="farmer")  # farmer, admin, etc.

    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email, "role": self.role}


class FarmProfile(db.Model):
    """
    Stores a farmer's semi-static field details - the ones that stay the
    same across most predictions (crop type, region, soil test results).
    A farmer can have MULTIPLE profiles (e.g. "North Field", "Central
    Field") since they may farm more than one plot in different regions
    or with different crops. The predict page lets them pick which saved
    field to apply before filling in the rest manually.
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    field_name = db.Column(db.String(100), nullable=False, default="My Field")

    crop_type = db.Column(db.String(50))
    region = db.Column(db.String(50))
    soil_ph = db.Column(db.Float)
    nitrogen_content = db.Column(db.Float)
    phosphorus_content = db.Column(db.Float)
    potassium_content = db.Column(db.Float)
    field_size_hectares = db.Column(db.Float)

    def to_dict(self):
        return {
            "id": self.id,
            "field_name": self.field_name,
            "crop_type": self.crop_type,
            "region": self.region,
            "soil_ph": self.soil_ph,
            "nitrogen_content": self.nitrogen_content,
            "phosphorus_content": self.phosphorus_content,
            "potassium_content": self.potassium_content,
            "field_size_hectares": self.field_size_hectares,
        }


class PredictionHistory(db.Model):
    """
    One row per prediction a farmer makes. Written automatically by the
    /predict endpoint right after a prediction is generated, and read by
    the /history endpoint for the farmer's History page.
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    # Which saved field this prediction was made for. Nullable: older rows
    # and predictions made without picking a saved field have no profile.
    # If the field is deleted, the history row stays (profile_id -> NULL).
    profile_id = db.Column(
        db.Integer, db.ForeignKey("farm_profile.id", ondelete="SET NULL"), nullable=True
    )
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    crop_type = db.Column(db.String(50))
    region = db.Column(db.String(50))
    season = db.Column(db.String(50))
    predicted_yield = db.Column(db.Float)
    typical_yield_for_crop = db.Column(db.Float)
    risk_level = db.Column(db.String(20))
    # Full record of the prediction: the inputs entered, soil flags, weather
    # context and AI insight. Null for predictions made before this existed.
    details = db.Column(db.JSON)

    def to_dict(self):
        return {
            "id": self.id,
            "profile_id": self.profile_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "crop_type": self.crop_type,
            "region": self.region,
            "season": self.season,
            "predicted_yield": self.predicted_yield,
            "typical_yield_for_crop": self.typical_yield_for_crop,
            "risk_level": self.risk_level,
            "details": self.details,
        }


class Translation(db.Model):
    """
    Cache of auto-translated UI text (see translate.py). One row per
    (language, English source string). Translations are produced once by the
    LLM and then reused for every user. To fix a bad translation, edit its
    `text` column directly.
    """
    id = db.Column(db.Integer, primary_key=True)
    lang = db.Column(db.String(5), nullable=False)
    source_hash = db.Column(db.String(40), nullable=False)  # sha1 of `source`, keeps the unique index small
    source = db.Column(db.Text, nullable=False)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    __table_args__ = (db.UniqueConstraint("lang", "source_hash", name="uq_translation_lang_source"),)
