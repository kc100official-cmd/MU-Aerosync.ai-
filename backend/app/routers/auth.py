from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from ..data.database import db
from ..models.schemas import LoginRequest, LoginResponse, User

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    users = db.data.get("users", [])
    user = next((u for u in users if u["email"] == req.email and u["password"] == req.password), None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password. Use demo account credentials.")

    # Record login audit event
    db.data.setdefault("audit", []).insert(0, {
        "id": f"aud-login-{user['id']}",
        "at": user.get("lastLogin", ""),
        "userId": user["id"],
        "action": "login",
        "detail": f"User {user['name']} logged in via API",
    })

    return {
        "token": f"aerosync-token-{user['id']}",
        "user": user,
    }

@router.get("/users", response_model=List[User])
def get_users():
    return db.data.get("users", [])

@router.get("/me")
def get_current_user(token: str = "aerosync-token-usr-eng"):
    user_id = token.replace("aerosync-token-", "")
    user = next((u for u in db.data.get("users", []) if u["id"] == user_id), None)
    if not user:
        return db.data.get("users", [])[0]
    return user
