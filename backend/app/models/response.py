"""
Response models (Pydantic schemas)
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum


class RiskLevel(str, Enum):
    """Risk level classification"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Action(str, Enum):
    """Recommended actions"""
    ALLOW = "allow"
    FLAG = "flag"
    BLOCK = "block"
    REVIEW = "review"


class HallucinationScore(BaseModel):
    """Hallucination detection results"""
    score: float = Field(..., ge=0, le=1, description="Hallucination probability (0-1)")
    unsupported_claims: List[str] = Field(default_factory=list)
    coverage_ratio: float = Field(..., ge=0, le=1)
    explanation: str


class SafetyScore(BaseModel):
    """Safety classification results"""
    score: float = Field(..., ge=0, le=1, description="Safety score (0-1, higher is safer)")
    violations: List[str] = Field(default_factory=list)
    categories: Dict[str, float] = Field(default_factory=dict)
    explanation: str


class FactualScore(BaseModel):
    """Factual consistency results"""
    score: float = Field(..., ge=0, le=1, description="Factual consistency score (0-1)")
    verified_claims: List[str] = Field(default_factory=list)
    unverified_claims: List[str] = Field(default_factory=list)
    explanation: str


class ConfidenceScore(BaseModel):
    """Confidence analysis results"""
    score: float = Field(..., ge=0, le=1, description="Confidence score (0-1)")
    uncertainty_markers: List[str] = Field(default_factory=list)
    hedging_detected: bool = False
    explanation: str


class EvaluationResponse(BaseModel):
    """Complete evaluation response"""
    
    # Overall assessment
    overall_risk: RiskLevel
    recommended_action: Action
    
    # Individual scores
    hallucination: HallucinationScore
    safety: SafetyScore
    factual: Optional[FactualScore] = None
    confidence: ConfidenceScore
    
    # Meta information
    evaluation_id: str
    timestamp: str
    processing_time_ms: float
    
    # Summary
    summary: str = Field(
        ...,
        description="Human-readable summary of the evaluation"
    )
    
    model_config = {
        "protected_namespaces": (),
        "json_schema_extra": {
            "examples": [{
                "overall_risk": "low",
                "recommended_action": "allow",
                "hallucination": {
                    "score": 0.15,
                    "unsupported_claims": [],
                    "coverage_ratio": 0.95,
                    "explanation": "All claims are well-supported by provided context"
                },
                "safety": {
                    "score": 0.98,
                    "violations": [],
                    "categories": {"toxicity": 0.01, "hate": 0.00},
                    "explanation": "No safety concerns detected"
                },
                "confidence": {
                    "score": 0.85,
                    "uncertainty_markers": [],
                    "hedging_detected": False,
                    "explanation": "Response is stated with high confidence"
                },
                "evaluation_id": "eval_1234567890",
                "timestamp": "2024-02-04T10:30:01Z",
                "processing_time_ms": 245.3,
                "summary": "Low risk output with no hallucinations or safety concerns detected"
            }]
        }
    }
