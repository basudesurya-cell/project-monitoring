import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/api/auth", tags=["authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = "officer"

class UserInfo(BaseModel):
    email: str
    name: str
    role: str
    department: str

class LoginResponse(BaseModel):
    status: str
    token: str
    user: UserInfo

ROLE_PROFILES = {
    "analyst": {
        "email": "analyst@mospi.gov.in",
        "name": "Dr. R. K. Verma",
        "role": "analyst",
        "department": "Infrastructure & Project Monitoring Division (IPMD), MoSPI"
    },
    "officer": {
        "email": "officer@nhai.gov.in",
        "name": "Er. S. Sengupta",
        "role": "officer",
        "department": "National Highways Authority of India (NHAI / MoRTH)"
    },
    "admin": {
        "email": "admin@diid.gov.in",
        "name": "Shri A. Mukherjee",
        "role": "admin",
        "department": "Data Innovation & Informatics Division (DIID), MoSPI"
    }
}

VALID_PASSWORDS = {"paimana2026", "admin123", "password", "demo2026"}

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    email_clean = request.email.strip().lower()
    selected_role = (request.role or "officer").strip().lower()

    # Determine matched role profile
    matched_role = selected_role if selected_role in ROLE_PROFILES else "officer"
    for role_key, profile in ROLE_PROFILES.items():
        if email_clean == profile["email"].lower():
            matched_role = role_key
            break

    profile = ROLE_PROFILES[matched_role]
    display_name = profile["name"]
    department = profile["department"]

    # Basic credential validation: accept standard demo passwords or any non-empty password for demo flexibility
    if not request.password or len(request.password.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password must be at least 3 characters long."
        )

    # Generate session token
    session_token = f"paimana_jwt_{uuid.uuid4().hex[:16]}"

    return LoginResponse(
        status="success",
        token=session_token,
        user=UserInfo(
            email=email_clean if "@" in email_clean else profile["email"],
            name=display_name,
            role=matched_role,
            department=department
        )
    )

@router.get("/me")
def verify_session():
    return {"status": "ok", "authenticated": True}
