"""Security hardening compatibility tests."""

from backend.app import main


def test_new_password_records_use_stronger_iteration_count():
    record = main._password_record("StrongPass123!")
    assert int(record["iterations"]) == main.PASSWORD_ITERATIONS
    assert main.PASSWORD_ITERATIONS >= 300_000
    assert main._password_matches("StrongPass123!", record)
    assert not main._password_matches("WrongPass123!", record)


def test_legacy_password_record_remains_compatible():
    password = "LegacyPass123!"
    salt = main.os.urandom(16)
    digest = main.hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        main.LEGACY_PASSWORD_ITERATIONS,
    )
    record = {"salt": main._b64encode(salt), "digest": main._b64encode(digest)}
    assert main._password_matches(password, record)


def test_invalid_iteration_record_is_rejected():
    record = main._password_record("StrongPass123!")
    record["iterations"] = "1"
    assert not main._password_matches("StrongPass123!", record)
