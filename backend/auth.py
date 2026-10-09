import json
import os
import time
import uuid
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

try:
    from .config import USERS_FILE, JWT_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
except ImportError:
    from config import USERS_FILE, JWT_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

security = HTTPBearer(auto_error=False)


class AuthStore:
    def __init__(self):
        self.file_path = USERS_FILE

    def _load_all(self):
        if not os.path.exists(self.file_path):
            return []
        try:
            with open(self.file_path, "r") as f:
                return json.load(f)
        except Exception:
            return []

    def _save_all(self, users):
        with open(self.file_path, "w") as f:
            json.dump(users, f, indent=2)

    def hash_password(self, password: str) -> str:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    def verify_password(self, password: str, hashed: str) -> bool:
        try:
            return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
        except Exception:
            return False

    def find_by_email(self, email: str):
        users = self._load_all()
        for u in users:
            if u["email"].lower() == email.strip().lower():
                return u
        return None

    def find_by_id(self, user_id: str):
        users = self._load_all()
        for u in users:
            if u["id"] == user_id:
                return u
        return None

    def get_all_users(self):
        users = self._load_all()
        clean = []
        for u in users:
            clean.append({
                "id": u["id"],
                "email": u["email"],
                "full_name": u.get("full_name", ""),
                "role": u.get("role", "farmer"),
                "farm_location": u.get("farm_location", ""),
                "department": u.get("department", ""),
                "account_status": u.get("account_status", "active"),
                "created_at": u.get("created_at", time.time())
            })
        return clean

    def create_user(self, email: str, password: str, full_name: str, role: str = "farmer", farm_location: str = None):
        if self.find_by_email(email):
            raise HTTPException(
                status_code=400,
                detail=f"User with email '{email}' already exists."
            )
        
        role = role.lower().strip()
        if role not in {"farmer", "admin"}:
            role = "farmer"

        new_user = {
            "id": f"usr_{uuid.uuid4().hex[:10]}",
            "email": email.strip().lower(),
            "password_hash": self.hash_password(password),
            "full_name": full_name.strip(),
            "role": role,
            "account_status": "active",
            "farm_location": farm_location or "",
            "created_at": time.time()
        }

        users = self._load_all()
        users.append(new_user)
        self._save_all(users)
        return new_user

    def update_user(self, user_id: str, role: str = None, account_status: str = None):
        users = self._load_all()
        for user in users:
            if user["id"] == user_id:
                if role in {"farmer", "admin"}:
                    user["role"] = role
                if account_status in {"active", "pending", "disabled"}:
                    user["account_status"] = account_status
                self._save_all(users)
                return user
        return None


class LoginHistoryStore:
    def __init__(self):
        self.file_path = os.path.join(os.path.dirname(USERS_FILE), "login_history.json")

    def _load(self):
        if not os.path.exists(self.file_path):
            return []
        try:
            with open(self.file_path, "r") as f:
                return json.load(f)
        except Exception:
            return []

    def _save(self, logs):
        with open(self.file_path, "w") as f:
            json.dump(logs, f, indent=2)

    def record_login(self, email: str, status: str, user: dict = None, ip_address: str = "127.0.0.1"):
        logs = self._load()
        now = time.time()
        readable_time = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(now))
        
        event = {
            "id": f"log_{uuid.uuid4().hex[:8]}",
            "email": email,
            "user_id": user["id"] if user else "N/A",
            "full_name": user.get("full_name", "Unknown") if user else "Guest/Failed",
            "role": user.get("role", "N/A") if user else "N/A",
            "status": status,
            "ip_address": ip_address,
            "timestamp": now,
            "formatted_time": readable_time
        }
        logs.insert(0, event)
        # Keep last 500 records
        self._save(logs[:500])
        return event

    def is_locked(self, email: str, limit: int = 5, window_seconds: int = 900) -> bool:
        cutoff = time.time() - window_seconds
        recent_failures = [
            event for event in self._load()
            if event.get("email", "").lower() == email.strip().lower()
            and event.get("status") == "FAILED"
            and event.get("timestamp", 0) >= cutoff
        ]
        return len(recent_failures) >= limit

    def get_all(self):
        return self._load()


auth_store = AuthStore()
login_history_store = LoginHistoryStore()


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = time.time() + (ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token.")


def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            return None
        return auth_store.find_by_id(user_id)
    except Exception:
        return None


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload.")
    user = auth_store.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User account not found.")
    if user.get("account_status", "active") != "active":
        raise HTTPException(status_code=403, detail="This account is not active. Please contact an administrator.")
    return user


def get_current_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to Admin accounts only."
        )
    return user
