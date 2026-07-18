from fastapi import APIRouter, HTTPException

from app.schemas.auth_schema import (
    LoginRequest,
    LoginResponse,
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