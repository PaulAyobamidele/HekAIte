import pytest
from sqlalchemy.orm import Session
from app.models.database import User, APIKey, Evaluation
from app.core.security import hash_password, generate_api_key, hash_for_storage
import uuid


def test_user_creation(db: Session):
    user = User(
        id=str(uuid.uuid4()),
        email="newuser@example.com",
        username="newuser",
        hashed_password=hash_password("password123"),
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    retrieved = db.query(User).filter(User.email == "newuser@example.com").first()
    assert retrieved is not None
    assert retrieved.username == "newuser"
    assert retrieved.is_active == True


def test_api_key_creation(db: Session, test_user: User):
    api_key_string = generate_api_key()
    api_key = APIKey(
        id=str(uuid.uuid4()),
        user_id=test_user.id,
        key=hash_for_storage(api_key_string),
        name="test-key",
        is_active=True
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    
    retrieved = db.query(APIKey).filter(APIKey.user_id == test_user.id).first()
    assert retrieved is not None
    assert retrieved.name == "test-key"


def test_evaluation_storage(db: Session, test_user: User):
    evaluation = Evaluation(
        id="eval_test123",
        user_id=test_user.id,
        prompt="What is the capital of France?",
        model_output="Paris",
        context=["Paris is the capital of France."],
        metadata={"model": "gpt-4"},
        overall_risk="low",
        recommended_action="allow",
        processing_time_ms=150.5,
        hallucination_score=0.1,
        safety_score=0.95,
        confidence_score=0.85,
        summary="Low risk output."
    )
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    
    retrieved = db.query(Evaluation).filter(
        Evaluation.id == "eval_test123"
    ).first()
    assert retrieved is not None
    assert retrieved.overall_risk == "low"
    assert retrieved.hallucination_score == 0.1


def test_user_evaluations_relationship(db: Session, test_user: User):
    eval1 = Evaluation(
        id="eval_1",
        user_id=test_user.id,
        prompt="Q1",
        model_output="A1",
        context=[],
        overall_risk="low",
        recommended_action="allow",
        processing_time_ms=100.0,
        hallucination_score=0.0,
        safety_score=1.0,
        confidence_score=0.8,
        summary="Summary 1"
    )
    
    eval2 = Evaluation(
        id="eval_2",
        user_id=test_user.id,
        prompt="Q2",
        model_output="A2",
        context=[],
        overall_risk="high",
        recommended_action="review",
        processing_time_ms=120.0,
        hallucination_score=0.5,
        safety_score=0.7,
        confidence_score=0.6,
        summary="Summary 2"
    )
    
    db.add(eval1)
    db.add(eval2)
    db.commit()
    
    user = db.query(User).filter(User.id == test_user.id).first()
    assert len(user.evaluations) == 2


def test_evaluation_query_ordering(db: Session, test_user: User):
    for i in range(3):
        evaluation = Evaluation(
            id=f"eval_{i}",
            user_id=test_user.id,
            prompt=f"Question {i}",
            model_output=f"Answer {i}",
            context=[],
            overall_risk="low",
            recommended_action="allow",
            processing_time_ms=100.0,
            hallucination_score=0.0,
            safety_score=1.0,
            confidence_score=0.8,
            summary=f"Summary {i}"
        )
        db.add(evaluation)
    
    db.commit()
    
    evals = db.query(Evaluation).filter(
        Evaluation.user_id == test_user.id
    ).order_by(Evaluation.created_at.desc()).all()
    
    assert len(evals) == 3
