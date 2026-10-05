from sqlalchemy.orm import Session
from ..models.notification import Notification
from ..models.user import User
from ..models.role import Role

def create_notification(db: Session, user_id: int, title: str, message: str, type: str = "info"):
    notification = Notification(user_id=user_id, title=title, message=message, type=type)
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

def notify_admins(db: Session, title: str, message: str, type: str = "info"):
    admins = db.query(User).join(Role).filter(Role.role_name == "admin").all()
    for admin in admins:
        notif = Notification(user_id=admin.id, title=title, message=message, type=type)
        db.add(notif)
    db.commit()
