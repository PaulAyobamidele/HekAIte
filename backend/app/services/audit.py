import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy import desc
from loguru import logger

from app.models.database import AuditLog


class AuditService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def log_event(
        self,
        db: Session,
        *,
        trace_id: str,
        span_id: str,
        event_type: str,
        user_id: Optional[str] = None,
        evaluation_id: Optional[str] = None,
        parent_span_id: Optional[str] = None,
        prompt: Optional[str] = None,
        model_output: Optional[str] = None,
        model_params: Optional[Dict[str, Any]] = None,
        evaluator_scores: Optional[Dict[str, Any]] = None,
        risk_decision: Optional[Dict[str, Any]] = None,
        latency_ms: Optional[float] = None,
        extra_data: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        entry = AuditLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            evaluation_id=evaluation_id,
            trace_id=trace_id,
            span_id=span_id,
            parent_span_id=parent_span_id,
            event_type=event_type,
            prompt=prompt,
            model_output=model_output,
            model_params=model_params,
            evaluator_scores=evaluator_scores,
            risk_decision=risk_decision,
            latency_ms=latency_ms,
            extra_data=extra_data,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        logger.debug(f"Audit log: trace={trace_id} event={event_type}")
        return entry

    def get_log(self, db: Session, log_id: str) -> Optional[AuditLog]:
        return db.query(AuditLog).filter(AuditLog.id == log_id).first()

    def get_trace(self, db: Session, trace_id: str) -> List[AuditLog]:
        return (
            db.query(AuditLog)
            .filter(AuditLog.trace_id == trace_id)
            .order_by(AuditLog.created_at.asc())
            .all()
        )

    def query_logs(
        self,
        db: Session,
        *,
        user_id: Optional[str] = None,
        event_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Dict[str, Any]:
        q = db.query(AuditLog)

        if user_id:
            q = q.filter(AuditLog.user_id == user_id)
        if event_type:
            q = q.filter(AuditLog.event_type == event_type)
        if start_date:
            q = q.filter(AuditLog.created_at >= start_date)
        if end_date:
            q = q.filter(AuditLog.created_at <= end_date)

        total = q.count()
        items = q.order_by(desc(AuditLog.created_at)).limit(limit).offset(offset).all()

        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "items": items,
        }


_instance: Optional[AuditService] = None


def get_audit_service() -> AuditService:
    global _instance
    if _instance is None:
        _instance = AuditService()
    return _instance
