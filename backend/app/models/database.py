from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")
    evaluations = relationship("Evaluation", back_populates="user", cascade="all, delete-orphan")


class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    key = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="api_keys")


class Evaluation(Base):
    __tablename__ = "evaluations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    prompt = Column(Text, nullable=False)
    model_output = Column(Text, nullable=False)
    context = Column(JSON, nullable=True)
    eval_metadata = Column("metadata", JSON, nullable=True)
    
    overall_risk = Column(String, nullable=False)
    recommended_action = Column(String, nullable=False)
    processing_time_ms = Column(Float, nullable=False)
    
    hallucination_score = Column(Float, nullable=False)
    safety_score = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False)
    
    summary = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    user = relationship("User", back_populates="evaluations")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    evaluation_id = Column(String, ForeignKey("evaluations.id"), nullable=True, index=True)
    trace_id = Column(String, nullable=False, index=True)
    span_id = Column(String, nullable=False)
    parent_span_id = Column(String, nullable=True)
    event_type = Column(String, nullable=False, index=True)  # evaluation_start, evaluation_complete, policy_check, etc.
    prompt = Column(Text, nullable=True)
    model_output = Column(Text, nullable=True)
    model_params = Column(JSON, nullable=True)
    evaluator_scores = Column(JSON, nullable=True)
    risk_decision = Column(JSON, nullable=True)
    latency_ms = Column(Float, nullable=True)
    extra_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", backref="audit_logs")
    evaluation = relationship("Evaluation", backref="audit_logs")


class Policy(Base):
    __tablename__ = "policies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    version = Column(Integer, default=1, nullable=False)
    eu_risk_category = Column(String, nullable=True)  # unacceptable, high, limited, minimal
    rules = Column(JSON, nullable=False)  # {"conditions": [...], "logic": "any"|"all", "action": "block", "severity": "critical"}
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="policies")


class PolicyViolation(Base):
    __tablename__ = "policy_violations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluation_id = Column(String, ForeignKey("evaluations.id"), nullable=False, index=True)
    policy_id = Column(String, ForeignKey("policies.id"), nullable=False, index=True)
    policy_version = Column(Integer, nullable=False)
    severity = Column(String, nullable=False)  # critical, high, medium, low
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    evaluation = relationship("Evaluation", backref="policy_violations")
    policy = relationship("Policy", backref="violations")


class RateLimitLog(Base):
    __tablename__ = "rate_limit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    api_key_id = Column(String, ForeignKey("api_keys.id"), nullable=False, index=True)
    endpoint = Column(String, nullable=False)
    request_count = Column(Integer, default=1)
    window_start = Column(DateTime, default=datetime.utcnow, index=True)
    window_end = Column(DateTime, nullable=False)
