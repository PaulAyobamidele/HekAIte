from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.api.deps import get_db, get_current_user_jwt
from app.models.database import User, Evaluation

router = APIRouter()


@router.get("/distribution")
async def get_distribution(
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db),
    days: int = Query(30, ge=1, le=365)
):
    since = datetime.utcnow() - timedelta(days=days)

    evals = (
        db.query(Evaluation)
        .filter(
            Evaluation.user_id == current_user.id,
            Evaluation.created_at >= since
        )
        .all()
    )

    risk_counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    action_counts = {"allow": 0, "flag": 0, "review": 0, "block": 0}
    hallucination_buckets = {"0-0.2": 0, "0.2-0.4": 0, "0.4-0.6": 0, "0.6-0.8": 0, "0.8-1.0": 0}
    safety_buckets = {"0-0.2": 0, "0.2-0.4": 0, "0.4-0.6": 0, "0.6-0.8": 0, "0.8-1.0": 0}

    for e in evals:
        risk_counts[e.overall_risk] = risk_counts.get(e.overall_risk, 0) + 1
        action_counts[e.recommended_action] = action_counts.get(e.recommended_action, 0) + 1

        h = e.hallucination_score
        if h < 0.2:
            hallucination_buckets["0-0.2"] += 1
        elif h < 0.4:
            hallucination_buckets["0.2-0.4"] += 1
        elif h < 0.6:
            hallucination_buckets["0.4-0.6"] += 1
        elif h < 0.8:
            hallucination_buckets["0.6-0.8"] += 1
        else:
            hallucination_buckets["0.8-1.0"] += 1

        s = e.safety_score
        if s < 0.2:
            safety_buckets["0-0.2"] += 1
        elif s < 0.4:
            safety_buckets["0.2-0.4"] += 1
        elif s < 0.6:
            safety_buckets["0.4-0.6"] += 1
        elif s < 0.8:
            safety_buckets["0.6-0.8"] += 1
        else:
            safety_buckets["0.8-1.0"] += 1

    return {
        "total_evaluations": len(evals),
        "days": days,
        "risk_distribution": risk_counts,
        "action_distribution": action_counts,
        "hallucination_distribution": hallucination_buckets,
        "safety_distribution": safety_buckets,
    }


@router.get("/risk-over-time")
async def get_risk_over_time(
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db),
    days: int = Query(30, ge=1, le=365)
):
    since = datetime.utcnow() - timedelta(days=days)

    evals = (
        db.query(Evaluation)
        .filter(
            Evaluation.user_id == current_user.id,
            Evaluation.created_at >= since
        )
        .order_by(Evaluation.created_at.asc())
        .all()
    )

    daily_data = {}
    for e in evals:
        date_key = e.created_at.strftime("%Y-%m-%d")
        if date_key not in daily_data:
            daily_data[date_key] = {
                "date": date_key,
                "total": 0,
                "low": 0, "medium": 0, "high": 0, "critical": 0,
                "avg_hallucination": 0.0,
                "avg_safety": 0.0,
                "avg_confidence": 0.0,
                "_h_sum": 0.0, "_s_sum": 0.0, "_c_sum": 0.0,
            }
        d = daily_data[date_key]
        d["total"] += 1
        d[e.overall_risk] = d.get(e.overall_risk, 0) + 1
        d["_h_sum"] += e.hallucination_score
        d["_s_sum"] += e.safety_score
        d["_c_sum"] += e.confidence_score

    result = []
    for d in daily_data.values():
        if d["total"] > 0:
            d["avg_hallucination"] = round(d["_h_sum"] / d["total"], 3)
            d["avg_safety"] = round(d["_s_sum"] / d["total"], 3)
            d["avg_confidence"] = round(d["_c_sum"] / d["total"], 3)
        del d["_h_sum"]
        del d["_s_sum"]
        del d["_c_sum"]
        result.append(d)

    return {"days": days, "data": result}


@router.get("/summary")
async def get_summary(
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db)
):
    total = db.query(func.count(Evaluation.id)).filter(
        Evaluation.user_id == current_user.id
    ).scalar()

    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_count = db.query(func.count(Evaluation.id)).filter(
        Evaluation.user_id == current_user.id,
        Evaluation.created_at >= today
    ).scalar()

    week_ago = datetime.utcnow() - timedelta(days=7)
    week_count = db.query(func.count(Evaluation.id)).filter(
        Evaluation.user_id == current_user.id,
        Evaluation.created_at >= week_ago
    ).scalar()

    avg_scores = db.query(
        func.avg(Evaluation.hallucination_score),
        func.avg(Evaluation.safety_score),
        func.avg(Evaluation.confidence_score),
        func.avg(Evaluation.processing_time_ms)
    ).filter(
        Evaluation.user_id == current_user.id
    ).first()

    blocked = db.query(func.count(Evaluation.id)).filter(
        Evaluation.user_id == current_user.id,
        Evaluation.recommended_action == "block"
    ).scalar()

    flagged = db.query(func.count(Evaluation.id)).filter(
        Evaluation.user_id == current_user.id,
        Evaluation.recommended_action.in_(["flag", "review"])
    ).scalar()

    return {
        "total_evaluations": total,
        "today_evaluations": today_count,
        "week_evaluations": week_count,
        "blocked_count": blocked,
        "flagged_count": flagged,
        "avg_hallucination_score": round(avg_scores[0] or 0, 3),
        "avg_safety_score": round(avg_scores[1] or 0, 3),
        "avg_confidence_score": round(avg_scores[2] or 0, 3),
        "avg_processing_time_ms": round(avg_scores[3] or 0, 1),
    }
