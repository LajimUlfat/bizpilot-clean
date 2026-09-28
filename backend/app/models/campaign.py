from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    business_id: Mapped[int] = mapped_column(
        ForeignKey("businesses.id"),
        nullable=False,
        index=True
    )

    ad_draft_id: Mapped[int | None] = mapped_column(
        ForeignKey("ad_drafts.id"),
        nullable=True,
        index=True
    )

    product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id"),
        nullable=True,
        index=True
    )

    campaign_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    platform: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    objective: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    budget: Mapped[float | None] = mapped_column(
        Numeric(10, 2),
        nullable=True
    )

    duration_days: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    start_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    end_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="draft",
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )