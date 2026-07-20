from secrets import token_urlsafe

from app.models.user import User
from app.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self):
        self.repository = UserRepository()
        self.sessions: dict[str, str] = {}

    @staticmethod
    def public_user(user: User) -> dict:
        is_worker = user.user_type == "worker"
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.user_type,
            "company_id": user.company_id,
            "avatar": None,
            "title": "Eletromecânico" if is_worker else "Empresa verificada",
        }

    def create_session(self, user: User) -> dict:
        token = token_urlsafe(32)
        self.sessions[token] = user.id
        return {"token": token, "user": self.public_user(user)}

    def login(
        self,
        email: str,
        password: str,
        user_type: str,
    ):
        normalized_email = email.strip().lower()
        normalized_user_type = user_type.strip().lower()

        if normalized_user_type not in {
            "worker",
            "company",
        }:
            return None

        user = self.repository.get_user_by_email(
            normalized_email
        )

        if user is None:
            return None

        if user.password != password:
            return None

        if user.user_type != normalized_user_type:
            return None

        return self.create_session(user)

    def register(
        self,
        *,
        name: str,
        email: str,
        password: str,
        user_type: str,
    ):
        if self.repository.get_user_by_email(email):
            return None
        user = self.repository.create_user(
            name=name,
            email=email,
            password=password,
            user_type=user_type,
        )
        return self.create_session(user)

    def get_user_from_token(self, token: str):
        user_id = self.sessions.get(token)
        if not user_id:
            return None
        user = self.repository.get_user_by_id(user_id)
        return self.public_user(user) if user else None
