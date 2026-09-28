import os

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status
)

from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.business import Business
from app.models.user import User
from app.api.auth import get_current_user

from app.services.supabase_storage import upload_product_image


router = APIRouter(
    prefix="/product-images",
    tags=["Product Images"]
)


ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp"
}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post(
    "/{product_id}",
    status_code=status.HTTP_201_CREATED
)
async def upload_product_image_endpoint(
    product_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # --------------------------------------------------
    # 1. Find current user's business
    # --------------------------------------------------

    business = (
        db.query(Business)
        .filter(Business.user_id == current_user.id)
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business not found."
        )

    # --------------------------------------------------
    # 2. Make sure product belongs to user's business
    # --------------------------------------------------

    product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.business_id == business.id
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    # --------------------------------------------------
    # 3. Validate file type
    # --------------------------------------------------

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WEBP images are allowed."
        )

    # --------------------------------------------------
    # 4. Read image
    # --------------------------------------------------

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty."
        )

    # --------------------------------------------------
    # 5. Validate file size
    # --------------------------------------------------

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Image size must be 5 MB or less."
        )

    # --------------------------------------------------
    # 6. Upload image to Supabase Cloud
    # --------------------------------------------------

    try:
        upload_result = upload_product_image(
            file_bytes=file_bytes,
            original_filename=file.filename or "product-image.jpg",
            product_id=product.id
        )

    except Exception as e:
        print("Supabase upload error:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Failed to upload image to cloud storage."
        )

    # --------------------------------------------------
    # 7. Check whether this is the first image
    # --------------------------------------------------

    existing_images = (
        db.query(ProductImage)
        .filter(
            ProductImage.product_id == product.id
        )
        .count()
    )

    is_primary = existing_images == 0

    # --------------------------------------------------
    # 8. Save cloud URL in PostgreSQL
    # --------------------------------------------------

    new_image = ProductImage(
        product_id=product.id,
        image_url=upload_result["public_url"],
        is_primary=is_primary
    )

    db.add(new_image)
    db.commit()
    db.refresh(new_image)

    # --------------------------------------------------
    # 9. Return cloud image information
    # --------------------------------------------------

    return {
        "message": "Product image uploaded successfully",
        "image": {
            "id": new_image.id,
            "product_id": new_image.product_id,
            "image_url": new_image.image_url,
            "is_primary": new_image.is_primary,
            "storage_path": upload_result["storage_path"]
        }
    }


@router.get("/{product_id}")
def get_product_images(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # --------------------------------------------------
    # 1. Find user's business
    # --------------------------------------------------

    business = (
        db.query(Business)
        .filter(Business.user_id == current_user.id)
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business not found."
        )

    # --------------------------------------------------
    # 2. Verify product ownership
    # --------------------------------------------------

    product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.business_id == business.id
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    # --------------------------------------------------
    # 3. Get product images
    # --------------------------------------------------

    images = (
        db.query(ProductImage)
        .filter(
            ProductImage.product_id == product.id
        )
        .order_by(
            ProductImage.is_primary.desc(),
            ProductImage.id.asc()
        )
        .all()
    )

    # --------------------------------------------------
    # 4. Return images
    # --------------------------------------------------

    return {
        "images": [
            {
                "id": image.id,
                "product_id": image.product_id,
                "image_url": image.image_url,
                "is_primary": image.is_primary
            }
            for image in images
        ]
    }