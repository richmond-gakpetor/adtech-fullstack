from datetime import timedelta

import pytest

from app.core.exceptions import UnauthorizedException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_access_token,
    verify_password,
    verify_refresh_token,
)


def test_password_hash_verifies_only_the_original_password():
    password_hash = hash_password("SecurePass1")

    assert verify_password("SecurePass1", password_hash) is True
    assert verify_password("WrongPass1", password_hash) is False


def test_access_and_refresh_tokens_are_not_interchangeable():
    token_data = {"sub": "test-user", "email": "test@example.com", "user_type": "owner"}
    access_token = create_access_token(token_data, expires_delta=timedelta(minutes=5))
    refresh_token = create_refresh_token(token_data, expires_delta=timedelta(days=1))

    assert verify_access_token(access_token)["sub"] == "test-user"
    assert verify_refresh_token(refresh_token)["sub"] == "test-user"

    with pytest.raises(UnauthorizedException):
        verify_access_token(refresh_token)

    with pytest.raises(UnauthorizedException):
        verify_refresh_token(access_token)