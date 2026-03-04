import pytest
from fastapi.testclient import TestClient


def test_missing_api_key(client: TestClient):
    payload = {
        "prompt": "Test",
        "model_output": "Test",
        "context": []
    }
    response = client.post("/api/v1/evaluate", json=payload)
    assert response.status_code == 401


def test_invalid_api_key(client: TestClient):
    headers = {"X-API-Key": "invalid_key"}
    payload = {
        "prompt": "Test",
        "model_output": "Test",
        "context": []
    }
    response = client.post(
        "/api/v1/evaluate", 
        json=payload,
        headers=headers
    )
    assert response.status_code == 401


def test_valid_api_key(client_with_auth: TestClient, test_api_key):
    payload = {
        "prompt": "Test",
        "model_output": "Test",
        "context": []
    }
    response = client_with_auth.post("/api/v1/evaluate", json=payload)
    assert response.status_code == 200


def test_api_key_header_required(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    
    payload = {
        "prompt": "Test",
        "model_output": "Test"
    }
    response = client.post("/api/v1/evaluate", json=payload)
    assert response.status_code == 401


def test_inactive_user_cannot_evaluate(client: TestClient, db, test_user, test_api_key):
    test_user.is_active = False
    db.commit()
    
    api_key_string, _ = test_api_key
    headers = {"X-API-Key": api_key_string}
    
    payload = {
        "prompt": "Test",
        "model_output": "Test"
    }
    response = client.post(
        "/api/v1/evaluate",
        json=payload,
        headers=headers
    )
    assert response.status_code == 403
