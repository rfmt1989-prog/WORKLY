from uuid import uuid4

from app.models.user import User


class UserRepository:
    def __init__(self):
        self.users = [
            User(
                id="worker-demo",
                name="Rodolfo Maia",
                email="demo@workly.pt",
                password="123456",
                user_type="worker",
                company_id=None,
            ),
            User(
                id="company-demo",
                name="Workly Demo Company",
                email="company@workly.pt",
                password="123456",
                user_type="company",
                company_id=10,
            ),
        ]

    def get_user_by_email(self, email: str):
        normalized_email = email.strip().lower()

        for user in self.users:
            if user.email.lower() == normalized_email:
                return user

        return None

    def get_user_by_id(self, user_id: str):
        return next(
            (user for user in self.users if user.id == user_id),
            None,
        )

    def create_user(
        self,
        *,
        name: str,
        email: str,
        password: str,
        user_type: str,
    ) -> User:
        user = User(
            id=str(uuid4()),
            name=name.strip(),
            email=email.strip().lower(),
            password=password,
            user_type=user_type,
            company_id=10 if user_type == "company" else None,
        )
        self.users.append(user)
        return user
