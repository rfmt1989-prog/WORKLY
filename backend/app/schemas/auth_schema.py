from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    user_type: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    user_type: str
    company_id: int | None = None