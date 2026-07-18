from dataclasses import dataclass


@dataclass
class User:

    id: int

    name: str

    email: str

    password: str

    user_type: str

    company_id: int | None = None

    active: bool = True