
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.models.business import Business
from app.models.product import Product
from app.api.auth import get_current_user
from app.schemas.ai import AdGenerationRequest
from app.services.ai.ad_generator import generate_ad


router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


@router.post("/ad-generation")
def generate_ad_endpoint(
    request: AdGenerationRequest,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    # ---------------------------------------------
    # Find user's business
    # ---------------------------------------------
    business = (
        db.query(Business)
        .filter(
            Business.user_id ==
            current_user.id
        )
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business not found."
        )

    # ---------------------------------------------
    # Find product belonging to user's business
    # ---------------------------------------------
    product = (
        db.query(Product)
        .filter(
            Product.id ==
            request.product_id,
            Product.business_id ==
            business.id
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    # ---------------------------------------------
    # Generate AI advertisement
    # ---------------------------------------------
    try:
        ad = generate_ad(
            business_name=business.business_name,
            product_name=product.product_name,
            product_description=product.description,
            price=float(product.price),
            platform=request.platform,
            objective=request.objective,
            tone=request.tone,
            additional_instructions=(
                request.additional_instructions
            ),
        )

    except Exception as e:
        print(
            "AI ad generation error:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate AI advertisement."
            )
        )

    return {
        "message": "AI advertisement generated successfully.",
        "ad": ad,
        "product": {
            "id": product.id,
            "product_name": product.product_name,
            "price": float(product.price),
        },
        "business": {
            "id": business.id,
            "business_name":
                business.business_name,
        },
    }

