from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.product import Product
from app.models.business import Business
from app.models.user import User
from app.api.auth import get_current_user
from app.schemas.product import ProductCreate, ProductUpdate
from app.models.product_image import ProductImage


router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get current user's business
    business = (
        db.query(Business)
        .filter(Business.user_id == current_user.id)
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business not found. Please set up your business first."
        )

    new_product = Product(
        business_id=business.id,
        product_name=product_data.product_name,
        description=product_data.description,
        price=product_data.price,
        stock_quantity=product_data.stock_quantity
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {
        "message": "Product created successfully",
        "product": {
            "id": new_product.id,
            "business_id": new_product.business_id,
            "product_name": new_product.product_name,
            "description": new_product.description,
            "price": float(new_product.price),
            "stock_quantity": new_product.stock_quantity,
            "created_at": new_product.created_at
        }
    }


@router.get("/")
def get_products(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get current user's business
    business = (
        db.query(Business)
        .filter(Business.user_id == current_user.id)
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business not found. Please set up your business first."
        )

    products = (
        db.query(Product)
        .filter(Product.business_id == business.id)
        .order_by(Product.id.desc())
        .all()
    )

    return {
        "products": [
            {
                "id": product.id,
                "business_id": product.business_id,
                "product_name": product.product_name,
                "description": product.description,
                "price": float(product.price),
                "stock_quantity": product.stock_quantity,
                "created_at": product.created_at
            }
            for product in products
        ]
    }


@router.put("/{product_id}")
def update_product(
    product_id: int,
    product_data: ProductUpdate,
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
            detail="Business not found."
        )

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

    if product_data.product_name is not None:
        product.product_name = product_data.product_name

    if product_data.description is not None:
        product.description = product_data.description

    if product_data.price is not None:
        product.price = product_data.price

    if product_data.stock_quantity is not None:
        product.stock_quantity = product_data.stock_quantity

    db.commit()
    db.refresh(product)

    return {
        "message": "Product updated successfully",
        "product": {
            "id": product.id,
            "business_id": product.business_id,
            "product_name": product.product_name,
            "description": product.description,
            "price": float(product.price),
            "stock_quantity": product.stock_quantity,
            "created_at": product.created_at
        }
    }


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
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
            detail="Business not found."
        )

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

    # Delete all image records linked to this product first.
    db.query(ProductImage).filter(
        ProductImage.product_id == product.id
    ).delete(
        synchronize_session=False
    )

    # Now delete the product.
    db.delete(product)

    db.commit()

    return {
        "message": "Product deleted successfully"
    }