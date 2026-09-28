from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.business import Business
from app.models.user import User
from app.api.auth import get_current_user
from app.schemas.business import BusinessCreate


router = APIRouter(
    prefix="/businesses",
    tags=["Business"]
)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_business(
    business_data: BusinessCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check whether the user already has a business
    existing_business = (
        db.query(Business)
        .filter(Business.user_id == current_user.id)
        .first()
    )

    if existing_business:
        raise HTTPException(
            status_code=400,
            detail="Business already exists for this user"
        )

    new_business = Business(
        user_id=current_user.id,
        business_name=business_data.business_name,
        business_type=business_data.business_type,
        description=business_data.description,
        website=business_data.website
    )

    db.add(new_business)
    db.commit()
    db.refresh(new_business)

    return {
        "message": "Business created successfully",
        "business": {
            "id": new_business.id,
            "business_name": new_business.business_name,
            "business_type": new_business.business_type,
            "description": new_business.description,
            "website": new_business.website,
            "user_id": new_business.user_id
        }
    }


@router.get("/me")
def get_my_business(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    business = (
        db.query(Business)
        .filter(Business.user_id == current_user.id)
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business not found"
        )

    return {
        "id": business.id,
        "business_name": business.business_name,
        "business_type": business.business_type,
        "description": business.description,
        "website": business.website,
        "user_id": business.user_id
    }