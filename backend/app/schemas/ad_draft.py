from pydantic import BaseModel, Field


class AdDraftCreate(BaseModel):
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

    primary_text: str = Field(
        min_length=1
    )

    headline: str = Field(
        min_length=1
    )

    description: str = Field(
        min_length=1
    )

    cta: str = Field(
        min_length=1,
        max_length=100
    )

    hashtags: list[str] = Field(
        default_factory=list
    )

    audience: str = Field(
        min_length=1
    )

    best_time: str = Field(
        min_length=1,
        max_length=100
    )

    strategy: str = Field(
        min_length=1
    )


class AdDraftUpdate(BaseModel):
    primary_text: str | None = None
    headline: str | None = None
    description: str | None = None
    cta: str | None = None
    hashtags: list[str] | None = None
    audience: str | None = None
    best_time: str | None = None
    strategy: str | None = None