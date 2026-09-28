from pydantic import BaseModel, Field


class BusinessCreate(BaseModel):
    business_name: str = Field(min_length=2, max_length=150)
    business_type: str = Field(min_length=2, max_length=100)
    description: str | None = None
    website: str | None = None