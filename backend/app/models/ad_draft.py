from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class AdDraft(Base):
    __tablename__ = "ad_drafts"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    business_id: Mapped[int] = mapped_column(
        ForeignKey("businesses.id"),
        nullable=False,
        index=True
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id"),
        nullable=False,
        index=True
    )

    platform: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    objective: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    tone: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    primary_text: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    headline: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    cta: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    hashtags: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    audience: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    best_time: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    strategy: Mapped[str] = mapped_column(
        Text,
        nullable=False
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