from app.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self):
        self.repository = UserRepository()

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

        return {
            "access_token": f"workly_demo_{user.id}",
            "token_type": "bearer",
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "user_type": user.user_type,
            "company_id": user.company_id,
        }

    def register(
        self,
        name: str,
        email: str,
        password: str,
        user_type: str,
    ):
        normalized_email = email.strip().lower()
        normalized_user_type = user_type.strip().lower()
        if normalized_user_type not in {"worker", "company"}:
            return None, "Tipo de perfil inválido."
        if len(name.strip()) < 2:
            return None, "Indica o teu nome."
        if len(password) < 6:
            return None, "A palavra-passe deve ter pelo menos 6 caracteres."
        if self.repository.get_user_by_email(normalized_email):
            return None, "Este email já está registado."
        user = self.repository.create_user(
            name=name,
            email=normalized_email,
            password=password,
            user_type=normalized_user_type,
        )
        return self._response(user), None

    def user_from_token(self, token: str):
        prefix = "workly_demo_"
        if not token.startswith(prefix):
            return None
        try:
            user_id = int(token.removeprefix(prefix))
        except ValueError:
            return None
        user = self.repository.get_user_by_id(user_id)
        return self._response(user) if user else None

    @staticmethod
    def _response(user):
        return {
            "access_token": f"workly_demo_{user.id}",
            "token_type": "bearer",
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "user_type": user.user_type,
            "company_id": user.company_id,
        }
