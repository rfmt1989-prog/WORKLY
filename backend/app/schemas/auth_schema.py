from typing import Literal

from pydantic import BaseModel, EmailStr, Field


UserRole = Literal["worker", "company"]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    user_type: UserRole


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: UserRole


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: UserRole
    company_id: int | None = None
    avatar: str | None = None
    title: str | None = None


class LoginResponse(BaseModel):
    token: str
    user: UserResponse
