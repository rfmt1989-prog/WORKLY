from fastapi import APIRouter, Header, HTTPException

from app.schemas.auth_schema import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
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


@router.post(
    "/register",
    response_model=LoginResponse,
)
async def register(data: RegisterRequest):
    result, error = service.register(
        name=data.name,
        email=data.email,
        password=data.password,
        user_type=data.user_type,
    )
    if result is None:
        raise HTTPException(status_code=400, detail=error)
    return result


@router.get(
    "/me",
    response_model=LoginResponse,
)
async def me(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Sessão inválida.")
    result = service.user_from_token(authorization.split(" ", 1)[1])
    if result is None:
        raise HTTPException(status_code=401, detail="Sessão inválida.")
    return result
