import json
import os
import time
import uuid

try:
    from .config import ADMIN_OPERATIONS_FILE
except ImportError:
    from config import ADMIN_OPERATIONS_FILE


class AdminOperationsStore:
    """Persistent records for administrative communications and governance."""

    def __init__(self):
        self.file_path = ADMIN_OPERATIONS_FILE
        self._ensure_file()

    def _ensure_file(self):
        if not os.path.exists(self.file_path) or os.path.getsize(self.file_path) == 0:
            self._save({"notifications": [], "audits": [], "feedback": [], "dataset_versions": []})

    def _load(self):
        try:
            with open(self.file_path, "r") as file:
                data = json.load(file)
                return {key: data.get(key, []) for key in ("notifications", "audits", "feedback", "dataset_versions")}
        except Exception:
            return {"notifications": [], "audits": [], "feedback": [], "dataset_versions": []}

    def _save(self, data):
        with open(self.file_path, "w") as file:
            json.dump(data, file, indent=2)

    def audit(self, admin, action, subject, details=""):
        data = self._load()
        event = {
            "id": f"audit_{uuid.uuid4().hex[:10]}",
            "action": action,
            "subject": subject,
            "details": details,
            "admin_email": admin["email"],
            "created_at": time.time(),
        }
        data["audits"].insert(0, event)
        data["audits"] = data["audits"][:500]
        self._save(data)
        return event

    def create_notification(self, admin, message, audience):
        data = self._load()
        notification = {
            "id": f"notice_{uuid.uuid4().hex[:10]}",
            "message": message.strip(),
            "audience": audience,
            "author": admin["full_name"],
            "created_at": time.time(),
        }
        data["notifications"].insert(0, notification)
        self._save(data)
        self.audit(admin, "Published announcement", audience, message.strip()[:120])
        return notification

    def add_feedback(self, user, rating, comment):
        data = self._load()
        feedback = {
            "id": f"feedback_{uuid.uuid4().hex[:10]}",
            "user_name": user["full_name"],
            "user_email": user["email"],
            "rating": rating,
            "comment": comment.strip(),
            "created_at": time.time(),
        }
        data["feedback"].insert(0, feedback)
        self._save(data)
        return feedback

    def add_dataset_version(self, admin, name, source, notes):
        data = self._load()
        version = {
            "id": f"dataset_{uuid.uuid4().hex[:10]}",
            "name": name.strip(),
            "source": source.strip(),
            "notes": notes.strip(),
            "author": admin["full_name"],
            "created_at": time.time(),
        }
        data["dataset_versions"].insert(0, version)
        self._save(data)
        self.audit(admin, "Registered dataset version", name.strip(), source.strip())
        return version

    def get_all(self, key):
        return self._load()[key]


admin_operations_store = AdminOperationsStore()
