from fastapi import APIRouter, Header, HTTPException

from app.schemas.auth_schema import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    UserResponse,
)
from app.services.auth_service import AuthService


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

service = AuthService()


@router.post(
    "/login",
    response_model=LoginResponse,
)
async def login(data: LoginRequest):
    result = service.login(
        email=data.email,
        password=data.password,
        user_type=data.user_type,
    )

    if result is None:
        raise HTTPException(
            status_code=401,
            detail=(
                "Credenciais inválidas ou perfil "
                "não corresponde ao utilizador."
            ),
        )

    return result


@router.post("/register", response_model=LoginResponse, status_code=201)
async def register(data: RegisterRequest):
    result = service.register(
        name=data.name,
        email=data.email,
        password=data.password,
        user_type=data.role,
    )
    if result is None:
        raise HTTPException(status_code=409, detail="Este email já está registado.")
    return result


@router.get("/me", response_model=UserResponse)
async def me(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Sessão inválida.")
    user = service.get_user_from_token(authorization.removeprefix("Bearer "))
    if user is None:
        raise HTTPException(status_code=401, detail="Sessão expirada.")
    return user
