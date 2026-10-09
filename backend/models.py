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
    Cache of auto-translated UI text (see translate.py).
    """
    id = db.Column(db.Integer, primary_key=True)
    lang = db.Column(db.String(5), nullable=False)
    source_hash = db.Column(db.String(40), nullable=False)
    source = db.Column(db.Text, nullable=False)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    __table_args__ = (db.UniqueConstraint("lang", "source_hash", name="uq_translation_lang_source"),)


class Announcement(db.Model):
    """
    Platform-wide broadcast messages from admin to all farmers.
    Appears directly in every farmer's notification bell.
    """
    __tablename__ = "announcement"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), default="General")  # Weather, Advisory, Feature, Alert
    created_by = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "message": self.message,
            "category": self.category,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class MarketPrice(db.Model):
    """
    Admin-managed market prices and cultivation costs per crop.
    Replaces static placeholders in the Farm Planner.
    """
    __tablename__ = "market_price"

    id = db.Column(db.Integer, primary_key=True)
    crop_type = db.Column(db.String(50), unique=True, nullable=False)
    price_per_tonne = db.Column(db.Float, nullable=False)
    cost_per_ha = db.Column(db.Float, nullable=False)
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
    updated_by = db.Column(db.String(100), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "crop_type": self.crop_type,
            "price_per_tonne": self.price_per_tonne,
            "cost_per_ha": self.cost_per_ha,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "updated_by": self.updated_by,
        }