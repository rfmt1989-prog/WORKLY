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
            "access_token": "workly_demo_token",
            "token_type": "bearer",
            "user_id": user.id,
            "user_type": user.user_type,
            "company_id": user.company_id,
        }