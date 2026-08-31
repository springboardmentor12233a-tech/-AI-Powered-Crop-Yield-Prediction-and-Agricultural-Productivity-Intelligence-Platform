import os
import sys

# Add project root to python path to resolve imports correctly
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

from backend.app.db.config import Base, engine, SessionLocal
from backend.app.db.models import User, Farm, Crop
from backend.app.auth.security import get_password_hash

def test_db_setup():
    print("Connecting to database and running migrations...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")
    
    db = SessionLocal()
    try:
        # Test User creation
        test_email = "test_farmer@yieldsense.com"
        existing = db.query(User).filter(User.email == test_email).first()
        if existing:
            print("Cleaning up old test data...")
            db.delete(existing)
            db.commit()
            
        print("Inserting test Farmer user...")
        hashed_pw = get_password_hash("securepass123")
        test_user = User(
            name="John Test Farmer",
            email=test_email,
            password_hash=hashed_pw,
            role="Farmer"
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        print(f"User created: {test_user.name} (ID: {test_user.id})")
        
        # Test Farm creation linked to User
        print("Inserting linked Farm record...")
        test_farm = Farm(
            user_id=test_user.id,
            farm_name="Sunset Meadows",
            location="California, North Valley",
            area=120.5,
            soil_type="Loamy"
        )
        db.add(test_farm)
        db.commit()
        db.refresh(test_farm)
        print(f"Farm created: {test_farm.farm_name} (ID: {test_farm.id}, Owner ID: {test_farm.user_id})")
        
        # Test Crop creation linked to Farm
        print("Inserting linked Crop record...")
        test_crop = Crop(
            farm_id=test_farm.id,
            crop_name="Maize",
            season="Kharif",
            historical_yield=4.2
        )
        db.add(test_crop)
        db.commit()
        db.refresh(test_crop)
        print(f"Crop log created: {test_crop.crop_name} (ID: {test_crop.id}, Farm ID: {test_crop.farm_id})")
        
        # Query validation
        user_query = db.query(User).filter(User.email == test_email).first()
        assert len(user_query.farms) == 1
        assert user_query.farms[0].crops[0].crop_name == "Maize"
        print("\n--- Relational schema verification SUCCESSFUL! ---")
        
        # Cleanup test data to keep db clean
        print("Cleaning up test data...")
        db.delete(test_user) # cascade deletes farm and crop
        db.commit()
        print("Database cleanup done.")
        
    except Exception as e:
        print(f"Database verification FAILED: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    test_db_setup()
