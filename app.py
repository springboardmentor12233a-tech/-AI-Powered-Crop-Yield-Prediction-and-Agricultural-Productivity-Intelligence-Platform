import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import json
import datetime
import os
from advisory_service import generate_agronomic_report

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    conn = sqlite3.connect('app.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT NOT NULL,
            crop TEXT NOT NULL,
            predictedYield REAL NOT NULL,
            date TEXT NOT NULL,
            formData TEXT NOT NULL,
            advisory_report TEXT NOT NULL
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT NOT NULL,
            userName TEXT NOT NULL,
            text TEXT NOT NULL,
            response TEXT,
            date TEXT NOT NULL
        )
    ''')
    # Insert a default admin user if none exists
    admin = conn.execute("SELECT * FROM users WHERE email='admin@example.com'").fetchone()
    if not admin:
        conn.execute("INSERT INTO users (name, email, password, role) VALUES ('Admin', 'admin@example.com', 'admin123', 'admin')")
    conn.commit()
    conn.close()

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
def read_root():
    return {"message": "Yield Predictor API is running!", "docs_url": "/docs"}

base_dir = os.path.dirname(os.path.abspath(__file__))
try:
    champion_model = joblib.load(os.path.join(base_dir, 'champion_agri_model.pkl'))
    scaler = joblib.load(os.path.join(base_dir, 'scaler.pkl'))
    model_columns = joblib.load(os.path.join(base_dir, 'model_columns.pkl'))
except Exception as e:
    print(f"Failed to load model artifacts: {e}")
    champion_model, scaler, model_columns = None, None, None

class Features(BaseModel):
    State: str
    Crop: str
    Soil_Type: str
    Fertilizer: str
    N: float
    P: float
    K: float
    Soil_pH: float
    Rainfall_mm: float
    Temperature_C: float
    Year: int

class UserLogin(BaseModel):
    email: str
    password: str

class UserSignup(BaseModel):
    name: str
    email: str
    password: str

class QueryCreate(BaseModel):
    userId: str
    userName: str
    text: str

class QueryReply(BaseModel):
    response: str

@app.post("/api/auth/signup")
def signup(user: UserSignup):
    conn = get_db_connection()
    try:
        conn.execute("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')", 
                     (user.name, user.email, user.password))
        conn.commit()
        user_row = conn.execute("SELECT * FROM users WHERE email = ?", (user.email,)).fetchone()
        return dict(user_row)
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="User with this email already exists.")
    finally:
        conn.close()

@app.post("/api/auth/login")
def login(user: UserLogin):
    conn = get_db_connection()
    user_row = conn.execute("SELECT * FROM users WHERE email = ? AND password = ?", 
                            (user.email, user.password)).fetchone()
    conn.close()
    if user_row:
        return dict(user_row)
    raise HTTPException(status_code=401, detail="Invalid credentials.")

@app.get("/api/users")
def get_users():
    conn = get_db_connection()
    users = conn.execute("SELECT * FROM users").fetchall()
    conn.close()
    return [dict(u) for u in users]

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int):
    conn = get_db_connection()
    conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.put("/api/users/{user_id}")
def edit_user(user_id: int, user: UserSignup):
    conn = get_db_connection()
    conn.execute("UPDATE users SET name=?, email=? WHERE id=?", (user.name, user.email, user_id))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.post("/api/predict")
async def predict_yield_and_advisory(features: Features, user: str = None):
    if not champion_model:
        raise HTTPException(status_code=500, detail="Model artifacts not loaded.")
    
    try:
        input_data = features.model_dump()
        df = pd.DataFrame([input_data])
        
        numerical_cols = ['N', 'P', 'K', 'Rainfall_mm', 'Temperature_C', 'Soil_pH', 'Year']
        categorical_cols = [col for col in df.columns if col not in numerical_cols]
        
        df_cat = pd.get_dummies(df[categorical_cols], drop_first=False)
        df_num = df[numerical_cols]
        df_num_scaled = pd.DataFrame(scaler.transform(df_num), columns=df_num.columns)
        
        df_processed = pd.concat([df_num_scaled, df_cat], axis=1)
        
        for col in model_columns:
            if col not in df_processed.columns:
                df_processed[col] = 0
        df_processed = df_processed[model_columns]
        
        log_pred = champion_model.predict(df_processed)[0]
        predicted_yield = float(np.expm1(log_pred))
        
        report = generate_agronomic_report(input_data, predicted_yield)
        
        if user:
            conn = get_db_connection()
            date_str = datetime.datetime.now().strftime("%Y-%m-%d")
            conn.execute('''INSERT INTO predictions (user, crop, predictedYield, date, formData, advisory_report) 
                            VALUES (?, ?, ?, ?, ?, ?)''',
                         (user, features.Crop, predicted_yield, date_str, json.dumps(input_data), report))
            conn.commit()
            conn.close()

        return {
            "predicted_yield_kg_per_acre": predicted_yield,
            "advisory_report": report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/predictions")
def get_predictions():
    conn = get_db_connection()
    preds = conn.execute("SELECT * FROM predictions ORDER BY id DESC").fetchall()
    conn.close()
    result = []
    for p in preds:
        d = dict(p)
        try:
            d["formData"] = json.loads(d["formData"])
        except:
            d["formData"] = {}
        result.append(d)
    return result

@app.post("/api/queries")
def create_query(q: QueryCreate):
    conn = get_db_connection()
    date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    conn.execute("INSERT INTO queries (userId, userName, text, date) VALUES (?, ?, ?, ?)",
                 (q.userId, q.userName, q.text, date_str))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.get("/api/queries")
def get_queries():
    conn = get_db_connection()
    queries = conn.execute("SELECT * FROM queries ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(q) for q in queries]

@app.post("/api/queries/{query_id}/reply")
def reply_query(query_id: int, q: QueryReply):
    conn = get_db_connection()
    conn.execute("UPDATE queries SET response=? WHERE id=?", (q.response, query_id))
    conn.commit()
    conn.close()
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    # Use standard PORT for any platform (Render, Railway, etc.), fallback to 8000
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
