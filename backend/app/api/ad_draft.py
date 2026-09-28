import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.models.business import Business
from app.models.product import Product
from app.models.ad_draft import AdDraft
from app.api.auth import get_current_user
from app.schemas.ad_draft import (
    AdDraftCreate,
    AdDraftUpdate,
)


router = APIRouter(
    prefix="/ad-drafts",
    tags=["Ad Drafts"]
)


def get_user_business(
    current_user: User,
    db: Session
):
    business = (
        db.query(Business)
        .filter(
            Business.user_id == current_user.id
        )
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business not found."
        )

    return business


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED
)
def create_ad_draft(
    request: AdDraftCreate,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    business = get_user_business(
        current_user,
        db
    )

    product = (
        db.query(Product)
        .filter(
            Product.id == request.product_id,
            Product.business_id == business.id
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    draft = AdDraft(
        business_id=business.id,
        product_id=product.id,
        platform=request.platform,
        objective=request.objective,
        tone=request.tone,
        primary_text=request.primary_text,
        headline=request.headline,
        description=request.description,
        cta=request.cta,
        hashtags=json.dumps(
            request.hashtags
        ),
        audience=request.audience,
        best_time=request.best_time,
        strategy=request.strategy,
        status="draft",
    )

    db.add(draft)
    db.commit()
    db.refresh(draft)

    return {
        "message": "Ad draft saved successfully.",
        "draft": {
            "id": draft.id,
            "product_id": draft.product_id,
            "platform": draft.platform,
            "objective": draft.objective,
            "tone": draft.tone,
            "primary_text": draft.primary_text,
            "headline": draft.headline,
            "description": draft.description,
            "cta": draft.cta,
            "hashtags": request.hashtags,
            "audience": draft.audience,
            "best_time": draft.best_time,
            "strategy": draft.strategy,
            "status": draft.status,
            "created_at": draft.created_at,
        }
    }


@router.get("/")
def get_ad_drafts(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    business = get_user_business(
        current_user,
        db
    )

    drafts = (
        db.query(AdDraft)
        .filter(
            AdDraft.business_id == business.id
        )
        .order_by(
            AdDraft.created_at.desc()
        )
        .all()
    )

    result = []

    for draft in drafts:
        try:
            hashtags = json.loads(
                draft.hashtags
            )
        except Exception:
            hashtags = []

        result.append({
            "id": draft.id,
            "product_id": draft.product_id,
            "platform": draft.platform,
            "objective": draft.objective,
            "tone": draft.tone,
            "primary_text": draft.primary_text,
            "headline": draft.headline,
            "description": draft.description,
            "cta": draft.cta,
            "hashtags": hashtags,
            "audience": draft.audience,
            "best_time": draft.best_time,
            "strategy": draft.strategy,
            "status": draft.status,
            "created_at": draft.created_at,
        })

    return result


@router.get("/{draft_id}")
def get_ad_draft(
    draft_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    business = get_user_business(
        current_user,
        db
    )

    draft = (
        db.query(AdDraft)
        .filter(
            AdDraft.id == draft_id,
            AdDraft.business_id == business.id
        )
        .first()
    )

    if not draft:
        raise HTTPException(
            status_code=404,
            detail="Ad draft not found."
        )

    try:
        hashtags = json.loads(
            draft.hashtags
        )
    except Exception:
        hashtags = []

    return {
        "id": draft.id,
        "product_id": draft.product_id,
        "platform": draft.platform,
        "objective": draft.objective,
        "tone": draft.tone,
        "primary_text": draft.primary_text,
        "headline": draft.headline,
        "description": draft.description,
        "cta": draft.cta,
        "hashtags": hashtags,
        "audience": draft.audience,
        "best_time": draft.best_time,
        "strategy": draft.strategy,
        "status": draft.status,
        "created_at": draft.created_at,
    }

@router.put("/{draft_id}")
def update_ad_draft(
    draft_id: int,
    request: AdDraftUpdate,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    business = get_user_business(
        current_user,
        db
    )

    draft = (
        db.query(AdDraft)
        .filter(
            AdDraft.id == draft_id,
            AdDraft.business_id == business.id
        )
        .first()
    )

    if not draft:
        raise HTTPException(
            status_code=404,
            detail="Ad draft not found."
        )

    if request.primary_text is not None:
        draft.primary_text = request.primary_text

    if request.headline is not None:
        draft.headline = request.headline

    if request.description is not None:
        draft.description = request.description

    if request.cta is not None:
        draft.cta = request.cta

    if request.hashtags is not None:
        draft.hashtags = json.dumps(
            request.hashtags
        )

    if request.audience is not None:
        draft.audience = request.audience

    if request.best_time is not None:
        draft.best_time = request.best_time

    if request.strategy is not None:
        draft.strategy = request.strategy

    db.commit()
    db.refresh(draft)

    try:
        hashtags = json.loads(
            draft.hashtags
        )
    except Exception:
        hashtags = []

    return {
        "message": "Ad draft updated successfully.",
        "draft": {
            "id": draft.id,
            "product_id": draft.product_id,
            "platform": draft.platform,
            "objective": draft.objective,
            "tone": draft.tone,
            "primary_text": draft.primary_text,
            "headline": draft.headline,
            "description": draft.description,
            "cta": draft.cta,
            "hashtags": hashtags,
            "audience": draft.audience,
            "best_time": draft.best_time,
            "strategy": draft.strategy,
            "status": draft.status,
            "created_at": draft.created_at,
        }
    }

@router.delete("/{draft_id}")
def delete_ad_draft(
    draft_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    business = get_user_business(
        current_user,
        db
    )

    draft = (
        db.query(AdDraft)
        .filter(
            AdDraft.id == draft_id,
            AdDraft.business_id == business.id
        )
        .first()
    )

    if not draft:
        raise HTTPException(
            status_code=404,
            detail="Ad draft not found."
        )

    db.delete(draft)
    db.commit()

    return {
        "message": "Ad draft deleted successfully."
    }

