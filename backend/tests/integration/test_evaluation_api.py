import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def test_health_check(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_ping_endpoint(client: TestClient):
    response = client.get("/api/v1/ping")
    assert response.status_code == 200
    assert response.json()["message"] == "pong"


def test_evaluators_status(client: TestClient):
    response = client.get("/api/v1/evaluators/status")
    assert response.status_code == 200
    data = response.json()
    assert "hallucination_detector" in data
    assert "safety_classifier" in data
    assert "confidence_scorer" in data


def test_evaluate_without_auth(client: TestClient):
    payload = {
        "prompt": "What is the capital of France?",
        "model_output": "Paris",
        "context": ["Paris is the capital of France."]
    }
    response = client.post("/api/v1/evaluate", json=payload)
    assert response.status_code == 401


def test_evaluate_with_valid_auth(client_with_auth: TestClient):
    payload = {
        "prompt": "What is the capital of France?",
        "model_output": "The capital of France is Paris.",
        "context": ["Paris is the capital of France."]
    }
    response = client_with_auth.post("/api/v1/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert "overall_risk" in data
    assert "recommended_action" in data
    assert "hallucination" in data
    assert "safety" in data
    assert "confidence" in data
    assert "evaluation_id" in data
    assert "timestamp" in data
    assert "processing_time_ms" in data
    assert "summary" in data


def test_evaluate_hallucination_detection(client_with_auth: TestClient):
    payload = {
        "prompt": "What is the capital of Germany?",
        "model_output": "The capital of Germany is Berlin, famous for its bratwurst.",
        "context": ["Berlin is the capital of Germany."]
    }
    response = client_with_auth.post("/api/v1/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["hallucination"]["score"] >= 0.0
    assert data["hallucination"]["score"] <= 1.0


def test_evaluate_safety_check(client_with_auth: TestClient):
    payload = {
        "prompt": "Describe something",
        "model_output": "This is a clean and safe response.",
        "context": ["Safe content only."]
    }
    response = client_with_auth.post("/api/v1/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["safety"]["score"] > 0.8


def test_evaluate_confidence_scoring(client_with_auth: TestClient):
    payload = {
        "prompt": "What is the answer?",
        "model_output": "The answer is definitely and certainly correct.",
        "context": ["Supporting evidence"]
    }
    response = client_with_auth.post("/api/v1/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["confidence"]["score"] > 0.5


def test_evaluate_preserves_metadata(client_with_auth: TestClient):
    payload = {
        "prompt": "Test",
        "model_output": "Response",
        "context": ["Context"],
        "metadata": {"model": "gpt-4", "temperature": 0.7}
    }
    response = client_with_auth.post("/api/v1/evaluate", json=payload)
    assert response.status_code == 200


def test_evaluate_risk_levels(client_with_auth: TestClient):
    payload = {
        "prompt": "Test question?",
        "model_output": "Test answer.",
        "context": ["Test context"]
    }
    response = client_with_auth.post("/api/v1/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    valid_risks = {"low", "medium", "high", "critical"}
    assert data["overall_risk"] in valid_risks


def test_evaluate_actions(client_with_auth: TestClient):
    payload = {
        "prompt": "Test?",
        "model_output": "Test.",
        "context": ["Context"]
    }
    response = client_with_auth.post("/api/v1/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    valid_actions = {"allow", "flag", "review", "block"}
    assert data["recommended_action"] in valid_actions


def test_list_evaluations_empty(client_with_auth: TestClient):
    response = client_with_auth.get("/api/v1/evaluations")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_evaluations_populated(client_with_auth: TestClient, db: Session, test_user):
    from app.models.database import Evaluation
    for i in range(3):
        ev = Evaluation(
            id=f"eval_test_{i}",
            user_id=test_user.id,
            prompt=f"Q{i}",
            model_output=f"A{i}",
            overall_risk="low",
            recommended_action="allow",
            processing_time_ms=100.0,
            hallucination_score=0.0,
            safety_score=1.0,
            confidence_score=0.8,
            summary=""
        )
        db.add(ev)
    db.commit()

    response = client_with_auth.get("/api/v1/evaluations")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    for item in data:
        assert "id" in item
        assert "prompt" in item
        assert "overall_risk" in item
