from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import uuid

from app.api.deps import get_db, get_current_user_jwt
from app.core.security import generate_api_key, hash_for_storage
from app.models.database import User, APIKey

router = APIRouter()


class CreateKeyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class CreateKeyResponse(BaseModel):
    id: str
    name: str
    key: str  # Only returned on creation
    created_at: str


class KeyInfo(BaseModel):
    id: str
    name: str
    is_active: bool
    last_used_at: str | None
    created_at: str


@router.get("", response_model=list[KeyInfo])
async def list_keys(
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db)
):
    keys = (
        db.query(APIKey)
        .filter(APIKey.user_id == current_user.id)
        .order_by(APIKey.created_at.desc())
        .all()
    )
    return [
        KeyInfo(
            id=k.id,
            name=k.name,
            is_active=k.is_active,
            last_used_at=k.last_used_at.isoformat() if k.last_used_at else None,
            created_at=k.created_at.isoformat()
        )
        for k in keys
    ]


@router.post("", response_model=CreateKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_key(
    request: CreateKeyRequest,
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db)
):
    raw_key = generate_api_key()

    api_key = APIKey(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        key=hash_for_storage(raw_key),
        name=request.name,
        is_active=True
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)

    return CreateKeyResponse(
        id=api_key.id,
        name=api_key.name,
        key=raw_key,
        created_at=api_key.created_at.isoformat()
    )


@router.post("/{key_id}/revoke")
async def revoke_key(
    key_id: str,
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db)
):
    api_key = (
        db.query(APIKey)
        .filter(APIKey.id == key_id, APIKey.user_id == current_user.id)
        .first()
    )

    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")

    if not api_key.is_active:
        raise HTTPException(status_code=400, detail="API key already revoked")

    api_key.is_active = False
    db.commit()

    return {"message": "API key revoked", "id": key_id}
