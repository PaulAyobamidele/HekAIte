import pytest
from app.core.security import (
    hash_password, 
    verify_password, 
    generate_api_key,
    hash_for_storage,
    verify_api_key,
    create_access_token,
    verify_token
)


def test_password_hashing():
    password = "testpassword123"
    hashed = hash_password(password)
    
    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("wrongpassword", hashed)


def test_api_key_generation():
    key1 = generate_api_key()
    key2 = generate_api_key()
    
    assert key1.startswith("sk_")
    assert key2.startswith("sk_")
    assert key1 != key2
    assert len(key1) > 10
    assert len(key2) > 10


def test_api_key_storage_and_verification():
    api_key = generate_api_key()
    hashed = hash_for_storage(api_key)
    
    assert hashed != api_key
    assert verify_api_key(api_key, hashed)
    assert not verify_api_key("wrong_key", hashed)


def test_token_creation_and_verification():
    data = {"sub": "user123", "email": "user@example.com"}
    token = create_access_token(data)
    
    assert token is not None
    assert len(token) > 0
    
    payload = verify_token(token)
    assert payload is not None
    assert payload["sub"] == "user123"
    assert payload["email"] == "user@example.com"


def test_token_expiration():
    data = {"sub": "user123"}
    token = create_access_token(data)
    
    payload = verify_token(token)
    assert "exp" in payload


def test_invalid_token_verification():
    invalid_token = "not.a.valid.token"
    payload = verify_token(invalid_token)
    assert payload is None
