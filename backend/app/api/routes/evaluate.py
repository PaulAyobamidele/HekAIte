from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from sqlalchemy.orm import Session
import time
import uuid
from loguru import logger

from app.models.request import EvaluationRequest
from app.models.response import (
    EvaluationResponse,
    RiskLevel,
    Action
)
from app.evaluators.hallucination import HallucinationDetector
from app.evaluators.safety import SafetyClassifier
from app.evaluators.confidence import ConfidenceScorer
from app.core.config import settings
from app.api.deps import get_current_user, get_db
from app.models.database import User, Evaluation
from app.services.audit import get_audit_service
from app.services.tracing import generate_trace_id, generate_span_id
from app.services.policy_engine import get_policy_engine

router = APIRouter()

hallucination_detector = HallucinationDetector(
    threshold=settings.HALLUCINATION_THRESHOLD
)
safety_classifier = SafetyClassifier(
    threshold=settings.SAFETY_THRESHOLD
)
confidence_scorer = ConfidenceScorer()


@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_output(
    request: EvaluationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    start_time = time.time()
    evaluation_id = f"eval_{uuid.uuid4().hex[:12]}"
    trace_id = generate_trace_id()
    span_id = generate_span_id()

    logger.info(f"[{evaluation_id}] Starting evaluation (trace={trace_id})")

    # Audit: evaluation_start
    try:
        audit_service = get_audit_service()
        audit_service.log_event(
            db,
            trace_id=trace_id,
            span_id=span_id,
            event_type="evaluation_start",
            user_id=current_user.id,
            prompt=request.prompt,
            model_output=request.model_output,
            model_params=request.metadata,
        )
    except Exception as audit_err:
        logger.warning(f"[{evaluation_id}] Audit log (start) failed: {audit_err}")

    try:
        hallucination_score = hallucination_detector.evaluate(
            model_output=request.model_output,
            context=request.context or []
        )
        
        safety_score = safety_classifier.evaluate(
            model_output=request.model_output
        )
        
        confidence_score = confidence_scorer.evaluate(
            model_output=request.model_output
        )
        
        overall_risk = _determine_risk_level(
            hallucination_score.score,
            safety_score.score,
            confidence_score.score
        )
        
        recommended_action = _recommend_action(
            overall_risk,
            hallucination_score.score,
            safety_score.score
        )
        
        summary = _generate_summary(
            overall_risk,
            hallucination_score,
            safety_score,
            confidence_score
        )
        
        processing_time_ms = (time.time() - start_time) * 1000
        
        logger.info(
            f"[{evaluation_id}] Evaluation complete: "
            f"risk={overall_risk}, "
            f"action={recommended_action}, "
            f"time={processing_time_ms:.1f}ms"
        )
        
        evaluation = Evaluation(
            id=evaluation_id,
            user_id=current_user.id,
            prompt=request.prompt,
            model_output=request.model_output,
            context=request.context,
            eval_metadata=request.metadata,
            overall_risk=overall_risk.value,
            recommended_action=recommended_action.value,
            processing_time_ms=round(processing_time_ms, 2),
            hallucination_score=hallucination_score.score,
            safety_score=safety_score.score,
            confidence_score=confidence_score.score,
            summary=summary
        )
        
        db.add(evaluation)
        db.commit()
        db.refresh(evaluation)

        # Policy engine: check active policies
        policy_violations = []
        try:
            policy_engine = get_policy_engine()
            policy_violations = policy_engine.evaluate_policies(
                db, evaluation, current_user.id
            )
            if policy_violations:
                logger.info(
                    f"[{evaluation_id}] {len(policy_violations)} policy violation(s) detected"
                )
        except Exception as policy_err:
            logger.warning(f"[{evaluation_id}] Policy check failed: {policy_err}")

        # Audit: evaluation_complete
        try:
            audit_service.log_event(
                db,
                trace_id=trace_id,
                span_id=generate_span_id(),
                parent_span_id=span_id,
                event_type="evaluation_complete",
                user_id=current_user.id,
                evaluation_id=evaluation_id,
                evaluator_scores={
                    "hallucination": hallucination_score.score,
                    "safety": safety_score.score,
                    "confidence": confidence_score.score,
                },
                risk_decision={
                    "risk_level": overall_risk.value,
                    "action": recommended_action.value,
                },
                latency_ms=round(processing_time_ms, 2),
                extra_data={"policy_violations": policy_violations} if policy_violations else None,
            )
        except Exception as audit_err:
            logger.warning(f"[{evaluation_id}] Audit log (complete) failed: {audit_err}")

        # Audit: policy_violation events
        if policy_violations:
            for pv in policy_violations:
                try:
                    audit_service.log_event(
                        db,
                        trace_id=trace_id,
                        span_id=generate_span_id(),
                        parent_span_id=span_id,
                        event_type="policy_violation",
                        user_id=current_user.id,
                        evaluation_id=evaluation_id,
                        extra_data=pv,
                    )
                except Exception:
                    pass

        return EvaluationResponse(
            overall_risk=overall_risk,
            recommended_action=recommended_action,
            hallucination=hallucination_score,
            safety=safety_score,
            confidence=confidence_score,
            evaluation_id=evaluation_id,
            timestamp=datetime.utcnow().isoformat(),
            processing_time_ms=round(processing_time_ms, 2),
            summary=summary
        )
    
    except Exception as e:
        logger.error(f"[{evaluation_id}] Evaluation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Evaluation failed: {str(e)}"
        )


def _determine_risk_level(
    hallucination_score: float,
    safety_score: float,
    confidence_score: float
) -> RiskLevel:
    if hallucination_score > 0.8 or safety_score < 0.5:
        return RiskLevel.CRITICAL
    
    if hallucination_score > 0.6 or safety_score < 0.7:
        return RiskLevel.HIGH
    
    if hallucination_score > 0.4 or safety_score < 0.85:
        return RiskLevel.MEDIUM
    
    return RiskLevel.LOW


def _recommend_action(
    risk_level: RiskLevel,
    hallucination_score: float,
    safety_score: float
) -> Action:
    if risk_level == RiskLevel.CRITICAL:
        return Action.BLOCK
    
    if risk_level == RiskLevel.HIGH:
        if safety_score < 0.7:
            return Action.BLOCK
        return Action.REVIEW
    
    if risk_level == RiskLevel.MEDIUM:
        return Action.FLAG
    
    return Action.ALLOW


def _generate_summary(
    risk_level: RiskLevel,
    hallucination_score,
    safety_score,
    confidence_score
) -> str:
    parts = []
    
    parts.append(f"{risk_level.value.capitalize()} risk output")
    
    if hallucination_score.score < 0.3:
        parts.append("with well-supported claims")
    elif hallucination_score.score < 0.6:
        parts.append("with some unsupported claims")
    else:
        parts.append("with significant hallucinations")
    
    if safety_score.score > 0.9:
        parts.append("and no safety concerns")
    elif safety_score.score > 0.7:
        parts.append("and minor safety concerns")
    else:
        parts.append("and safety violations")
    
    return " ".join(parts) + "."


@router.get("/evaluators/status")
async def get_evaluators_status():
    return {
        "hallucination_detector": {
            "status": "ready",
            "threshold": settings.HALLUCINATION_THRESHOLD
        },
        "safety_classifier": {
            "status": "ready",
            "threshold": settings.SAFETY_THRESHOLD
        },
        "confidence_scorer": {
            "status": "ready"
        }
    }


@router.get("/evaluations")
async def list_evaluations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20,
    offset: int = 0
):
    total = (
        db.query(Evaluation)
        .filter(Evaluation.user_id == current_user.id)
        .count()
    )
    items = (
        db.query(Evaluation)
        .filter(Evaluation.user_id == current_user.id)
        .order_by(Evaluation.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [
            {
                "id": e.id,
                "prompt": e.prompt,
                "model_output": e.model_output,
                "overall_risk": e.overall_risk,
                "recommended_action": e.recommended_action,
                "hallucination_score": e.hallucination_score,
                "safety_score": e.safety_score,
                "confidence_score": e.confidence_score,
                "processing_time_ms": e.processing_time_ms,
                "summary": e.summary,
                "created_at": e.created_at.isoformat()
            }
            for e in items
        ]
    }


@router.get("/evaluations/{evaluation_id}")
async def get_evaluation(
    evaluation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    evaluation = (
        db.query(Evaluation)
        .filter(
            Evaluation.id == evaluation_id,
            Evaluation.user_id == current_user.id
        )
        .first()
    )
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    return {
        "id": evaluation.id,
        "prompt": evaluation.prompt,
        "model_output": evaluation.model_output,
        "context": evaluation.context,
        "metadata": evaluation.eval_metadata,
        "overall_risk": evaluation.overall_risk,
        "recommended_action": evaluation.recommended_action,
        "hallucination_score": evaluation.hallucination_score,
        "safety_score": evaluation.safety_score,
        "confidence_score": evaluation.confidence_score,
        "processing_time_ms": evaluation.processing_time_ms,
        "summary": evaluation.summary,
        "created_at": evaluation.created_at.isoformat()
    }
