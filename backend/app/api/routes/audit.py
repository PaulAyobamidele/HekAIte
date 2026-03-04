"""
Audit log routes — query the structured audit trail.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.api.deps import get_current_user_jwt, get_db
from app.models.database import User, AuditLog
from app.services.audit import get_audit_service

router = APIRouter()


@router.get("/logs")
async def list_audit_logs(
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    start_date: Optional[str] = Query(None, description="ISO date start filter"),
    end_date: Optional[str] = Query(None, description="ISO date end filter"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db),
):
    audit_service = get_audit_service()

    parsed_start = datetime.fromisoformat(start_date) if start_date else None
    parsed_end = datetime.fromisoformat(end_date) if end_date else None

    result = audit_service.query_logs(
        db,
        user_id=current_user.id,
        event_type=event_type,
        start_date=parsed_start,
        end_date=parsed_end,
        limit=limit,
        offset=offset,
    )

    return {
        "total": result["total"],
        "limit": result["limit"],
        "offset": result["offset"],
        "items": [_serialize_log(log) for log in result["items"]],
    }


@router.get("/logs/{log_id}")
async def get_audit_log(
    log_id: str,
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db),
):
    audit_service = get_audit_service()
    log = audit_service.get_log(db, log_id)
    if not log or log.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Audit log not found")
    return _serialize_log(log)


@router.get("/traces/{trace_id}")
async def get_trace(
    trace_id: str,
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db),
):
    audit_service = get_audit_service()
    logs = audit_service.get_trace(db, trace_id)

    # Filter to user's own logs
    user_logs = [log for log in logs if log.user_id == current_user.id]
    if not user_logs:
        raise HTTPException(status_code=404, detail="Trace not found")

    return {
        "trace_id": trace_id,
        "span_count": len(user_logs),
        "events": [_serialize_log(log) for log in user_logs],
    }


def _serialize_log(log: AuditLog) -> dict:
    return {
        "id": log.id,
        "trace_id": log.trace_id,
        "span_id": log.span_id,
        "parent_span_id": log.parent_span_id,
        "event_type": log.event_type,
        "evaluation_id": log.evaluation_id,
        "prompt": log.prompt,
        "model_output": log.model_output,
        "model_params": log.model_params,
        "evaluator_scores": log.evaluator_scores,
        "risk_decision": log.risk_decision,
        "latency_ms": log.latency_ms,
        "extra_data": log.extra_data,
        "created_at": log.created_at.isoformat() if log.created_at else None,
    }
