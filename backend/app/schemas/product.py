from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    product_name: str = Field(min_length=2, max_length=150)
    description: str | None = None
    price: float = Field(ge=0)
    stock_quantity: int = Field(default=0, ge=0)

class ProductUpdate(BaseModel):
    product_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150
    )

    description: str | None = None

    price: float | None = Field(
        default=None,
        ge=0
    )

    stock_quantity: int | None = Field(
        default=None,
        ge=0
    )

    