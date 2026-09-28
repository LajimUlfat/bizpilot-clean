
from pydantic import BaseModel, Field


class AdGenerationRequest(BaseModel):
    product_id: int

    platform: str = Field(
        min_length=2,
        max_length=30
    )

    objective: str = Field(
        min_length=2,
        max_length=50
    )

    tone: str = Field(
        min_length=2,
        max_length=50
    )

    additional_instructions: str | None = (
        Field(
            default=None,
            max_length=1000
        )
    )

