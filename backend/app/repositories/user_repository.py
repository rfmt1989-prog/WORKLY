from app.models.user import User


class UserRepository:
    def __init__(self):
        self.users = [
            User(
                id=1,
                name="Demo Worker",
                email="worker@workly.pt",
                password="123456",
                user_type="worker",
                company_id=None,
            ),
            User(
                id=2,
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