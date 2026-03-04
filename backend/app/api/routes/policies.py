from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.api.deps import get_current_user_jwt, get_db
from app.models.database import User, Policy, PolicyViolation
from app.services.policy_engine import get_policy_engine

router = APIRouter()


class PolicyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    eu_risk_category: Optional[str] = None
    rules: dict


class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    eu_risk_category: Optional[str] = None
    rules: Optional[dict] = None
    is_active: Optional[bool] = None


class PolicyTestRequest(BaseModel):
    test_data: dict


def serialize_policy(p: Policy) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "version": p.version,
        "eu_risk_category": p.eu_risk_category,
        "rules": p.rules,
        "is_active": p.is_active,
        "violation_count": len(p.violations) if p.violations else 0,
        "created_at": p.created_at.isoformat(),
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


@router.get("/policies")
async def list_policies(
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db),
):
    policies = (
        db.query(Policy)
        .filter(Policy.user_id == current_user.id)
        .order_by(Policy.created_at.desc())
        .all()
    )
    return {"items": [serialize_policy(p) for p in policies], "total": len(policies)}


@router.post("/policies")
async def create_policy(
    body: PolicyCreate,
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db),
):
    engine = get_policy_engine()
    policy = engine.create_policy(
        db,
        user_id=current_user.id,
        name=body.name,
        description=body.description,
        eu_risk_category=body.eu_risk_category,
        rules=body.rules,
    )
    return serialize_policy(policy)


@router.get("/policies/templates")
async def get_templates(
    current_user: User = Depends(get_current_user_jwt),
):
    engine = get_policy_engine()
    return {"templates": engine.get_templates()}


@router.get("/policies/violations")
async def list_violations(
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
    severity: Optional[str] = None,
):
    query = (
        db.query(PolicyViolation)
        .join(Policy)
        .filter(Policy.user_id == current_user.id)
    )
    if severity:
        query = query.filter(PolicyViolation.severity == severity)
    total = query.count()
    items = query.order_by(PolicyViolation.created_at.desc()).offset(offset).limit(limit).all()
    return {
        "total": total,
        "items": [
            {
                "id": v.id,
                "evaluation_id": v.evaluation_id,
                "policy_id": v.policy_id,
                "policy_name": v.policy.name if v.policy else None,
                "policy_version": v.policy_version,
                "severity": v.severity,
                "details": v.details,
                "created_at": v.created_at.isoformat(),
            }
            for v in items
        ],
    }


@router.get("/policies/{policy_id}")
async def get_policy(
    policy_id: str,
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db),
):
    policy = (
        db.query(Policy)
        .filter(Policy.id == policy_id, Policy.user_id == current_user.id)
        .first()
    )
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    violations = (
        db.query(PolicyViolation)
        .filter(PolicyViolation.policy_id == policy_id)
        .order_by(PolicyViolation.created_at.desc())
        .limit(50)
        .all()
    )

    result = serialize_policy(policy)
    result["violations"] = [
        {
            "id": v.id,
            "evaluation_id": v.evaluation_id,
            "severity": v.severity,
            "details": v.details,
            "created_at": v.created_at.isoformat(),
        }
        for v in violations
    ]
    return result


@router.put("/policies/{policy_id}")
async def update_policy(
    policy_id: str,
    body: PolicyUpdate,
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db),
):
    policy = (
        db.query(Policy)
        .filter(Policy.id == policy_id, Policy.user_id == current_user.id)
        .first()
    )
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    engine = get_policy_engine()
    updated = engine.update_policy(
        db,
        policy,
        name=body.name,
        description=body.description,
        rules=body.rules,
        eu_risk_category=body.eu_risk_category,
        is_active=body.is_active,
    )
    return serialize_policy(updated)


@router.delete("/policies/{policy_id}")
async def delete_policy(
    policy_id: str,
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db),
):
    policy = (
        db.query(Policy)
        .filter(Policy.id == policy_id, Policy.user_id == current_user.id)
        .first()
    )
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    db.delete(policy)
    db.commit()
    return {"detail": "Policy deleted"}


@router.post("/policies/{policy_id}/test")
async def test_policy(
    policy_id: str,
    body: PolicyTestRequest,
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db),
):
    policy = (
        db.query(Policy)
        .filter(Policy.id == policy_id, Policy.user_id == current_user.id)
        .first()
    )
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    engine = get_policy_engine()
    result = engine.test_policy_against_data(policy.rules, body.test_data)
    return result
