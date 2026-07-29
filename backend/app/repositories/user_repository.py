from app.models.user import User


USERS = [
    User(
        id=1,
        name="João Silva",
        email="worker@workly.pt",
        password="123456",
        user_type="worker",
        company_id=None,
    ),
    User(
        id=2,
        name="Workly Build Portugal",
        email="company@workly.pt",
        password="123456",
        user_type="company",
        company_id=10,
    ),
    User(
        id=3,
        name="Lumen Technical Services",
        email="technical@workly.pt",
        password="123456",
        user_type="company",
        company_id=20,
    ),
]


class UserRepository:
    def __init__(self):
        self.users = USERS

    def get_user_by_email(self, email: str):
        normalized_email = email.strip().lower()

        for user in self.users:
            if user.email.lower() == normalized_email:
                return user

        return None

    def get_user_by_id(self, user_id: int):
        return next(
            (user for user in self.users if user.id == user_id),
            None,
        )

    def create_user(
        self,
        name: str,
        email: str,
        password: str,
        user_type: str,
    ):
        user = User(
            id=max((item.id for item in self.users), default=0) + 1,
            name=name.strip(),
            email=email.strip().lower(),
            password=password,
            user_type=user_type,
            company_id=(
                max(
                    (
                        item.company_id or 0
                        for item in self.users
                    ),
                    default=0,
                )
                + 10
                if user_type == "company"
                else None
            ),
        )
        self.users.append(user)
        return user
