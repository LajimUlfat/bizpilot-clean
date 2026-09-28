from datetime import datetime

from pydantic import BaseModel, Field


class CampaignCreate(BaseModel):
    ad_draft_id: int | None = None

    product_id: int | None = None

    campaign_name: str = Field(
        min_length=2,
        max_length=150
    )

    platform: str = Field(
        min_length=2,
        max_length=30
    )

    objective: str = Field(
        min_length=2,
        max_length=50
    )

    budget: float | None = Field(
        default=None,
        ge=0
    )

    duration_days: int | None = Field(
        default=None,
        ge=1
    )

    start_date: datetime | None = None

    end_date: datetime | None = None

    status: str = Field(
        default="draft",
        min_length=2,
        max_length=30
    )


class CampaignUpdate(BaseModel):
    campaign_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150
    )

    platform: str | None = Field(
        default=None,
        min_length=2,
        max_length=30
    )

    objective: str | None = Field(
        default=None,
        min_length=2,
        max_length=50
    )

    budget: float | None = Field(
        default=None,
        ge=0
    )

    duration_days: int | None = Field(
        default=None,
        ge=1
    )

    start_date: datetime | None = None

    end_date: datetime | None = None

    status: str | None = Field(
        default=None,
        min_length=2,
        max_length=30
    )
    