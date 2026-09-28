from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.business import Business
from app.models.campaign import Campaign
from app.models.product import Product
from app.models.ad_draft import AdDraft
from app.schemas.campaign import CampaignCreate, CampaignUpdate
from app.api.auth import get_current_user


router = APIRouter(
    prefix="/campaigns",
    tags=["Campaigns"]
)


def serialize_campaign(
    campaign: Campaign,
    draft: AdDraft | None = None,
    product: Product | None = None,
):
    return {
        "id": campaign.id,
        "business_id": campaign.business_id,
        "ad_draft_id": campaign.ad_draft_id,
        "product_id": campaign.product_id,
        "campaign_name": campaign.campaign_name,
        "platform": campaign.platform,
        "objective": campaign.objective,
        "budget": float(campaign.budget) if campaign.budget is not None else None,
        "duration_days": campaign.duration_days,
        "start_date": campaign.start_date,
        "end_date": campaign.end_date,
        "status": campaign.status,
        "created_at": campaign.created_at,
        "updated_at": campaign.updated_at,

        "product": (
            {
                "id": product.id,
                "product_name": product.product_name,
                "description": product.description,
                "price": float(product.price),
                "stock_quantity": product.stock_quantity,
            }
            if product
            else None
        ),

        "ad_content": (
            {
                "primary_text": draft.primary_text,
                "headline": draft.headline,
                "description": draft.description,
                "cta": draft.cta,
                "hashtags": (
                    draft.hashtags.split(",")
                    if draft.hashtags
                    else []
                ),
                "audience": draft.audience,
                "best_time": draft.best_time,
                "strategy": draft.strategy,
                "tone": draft.tone,
            }
            if draft
            else None
        ),
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_campaign(
    campaign_data: CampaignCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # ---------------------------------------------------------
    # Get user's business
    # ---------------------------------------------------------
    business = (
        db.query(Business)
        .filter(Business.user_id == current_user.id)
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business profile not found."
        )

    # ---------------------------------------------------------
    # Validate ad draft if supplied
    # ---------------------------------------------------------
    draft = None

    if campaign_data.ad_draft_id is not None:
        draft = (
            db.query(AdDraft)
            .filter(
                AdDraft.id == campaign_data.ad_draft_id,
                AdDraft.business_id == business.id,
            )
            .first()
        )

        if not draft:
            raise HTTPException(
                status_code=404,
                detail="Advertisement draft not found."
            )

    # ---------------------------------------------------------
    # Validate product if supplied
    # ---------------------------------------------------------
    product = None

    if campaign_data.product_id is not None:
        product = (
            db.query(Product)
            .filter(
                Product.id == campaign_data.product_id,
                Product.business_id == business.id,
            )
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail="Product not found."
            )

    # ---------------------------------------------------------
    # If draft exists but product wasn't supplied,
    # use the draft's product
    # ---------------------------------------------------------
    if draft and product is None:
        product = (
            db.query(Product)
            .filter(
                Product.id == draft.product_id,
                Product.business_id == business.id,
            )
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail="Product connected to advertisement draft not found."
            )

        campaign_data.product_id = product.id

    # ---------------------------------------------------------
    # Validate dates
    # ---------------------------------------------------------
    if (
        campaign_data.start_date is not None
        and campaign_data.end_date is not None
        and campaign_data.end_date < campaign_data.start_date
    ):
        raise HTTPException(
            status_code=400,
            detail="End date cannot be earlier than start date."
        )

    # ---------------------------------------------------------
    # Create campaign
    #
    # IMPORTANT:
    # Do NOT pass notes= because Campaign model
    # currently does not have a notes column.
    # ---------------------------------------------------------
    campaign = Campaign(
        business_id=business.id,
        ad_draft_id=campaign_data.ad_draft_id,
        product_id=campaign_data.product_id,
        campaign_name=campaign_data.campaign_name.strip(),
        platform=campaign_data.platform.strip(),
        objective=campaign_data.objective.strip(),
        budget=campaign_data.budget,
        duration_days=campaign_data.duration_days,
        start_date=campaign_data.start_date,
        end_date=campaign_data.end_date,
        status="draft",
    )

    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    return {
        "message": "Campaign created successfully.",
        "campaign": serialize_campaign(
            campaign,
            draft=draft,
            product=product,
        ),
    }


@router.get("/")
def get_campaigns(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    business = (
        db.query(Business)
        .filter(Business.user_id == current_user.id)
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business profile not found."
        )

    campaigns = (
        db.query(Campaign)
        .filter(Campaign.business_id == business.id)
        .order_by(Campaign.created_at.desc())
        .all()
    )

    result = []

    for campaign in campaigns:
        draft = None
        product = None

        if campaign.ad_draft_id:
            draft = (
                db.query(AdDraft)
                .filter(AdDraft.id == campaign.ad_draft_id)
                .first()
            )

        if campaign.product_id:
            product = (
                db.query(Product)
                .filter(Product.id == campaign.product_id)
                .first()
            )

        result.append(
            serialize_campaign(
                campaign,
                draft=draft,
                product=product,
            )
        )

    return {
        "campaigns": result
    }


@router.get("/{campaign_id}")
def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    business = (
        db.query(Business)
        .filter(Business.user_id == current_user.id)
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business profile not found."
        )

    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.id == campaign_id,
            Campaign.business_id == business.id,
        )
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found."
        )

    draft = None
    product = None

    if campaign.ad_draft_id:
        draft = (
            db.query(AdDraft)
            .filter(AdDraft.id == campaign.ad_draft_id)
            .first()
        )

    if campaign.product_id:
        product = (
            db.query(Product)
            .filter(Product.id == campaign.product_id)
            .first()
        )

    return {
        "campaign": serialize_campaign(
            campaign,
            draft=draft,
            product=product,
        )
    }


@router.put("/{campaign_id}")
def update_campaign(
    campaign_id: int,
    campaign_data: CampaignUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    business = (
        db.query(Business)
        .filter(Business.user_id == current_user.id)
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business profile not found."
        )

    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.id == campaign_id,
            Campaign.business_id == business.id,
        )
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found."
        )

    update_data = campaign_data.model_dump(
        exclude_unset=True
    )

    if "campaign_name" in update_data:
        campaign.campaign_name = update_data["campaign_name"].strip()

    if "platform" in update_data:
        campaign.platform = update_data["platform"].strip()

    if "objective" in update_data:
        campaign.objective = update_data["objective"].strip()

    if "budget" in update_data:
        campaign.budget = update_data["budget"]

    if "duration_days" in update_data:
        campaign.duration_days = update_data["duration_days"]

    if "start_date" in update_data:
        campaign.start_date = update_data["start_date"]

    if "end_date" in update_data:
        campaign.end_date = update_data["end_date"]

    if "status" in update_data:
        campaign.status = update_data["status"].strip()

    # Validate final dates
    if (
        campaign.start_date is not None
        and campaign.end_date is not None
        and campaign.end_date < campaign.start_date
    ):
        raise HTTPException(
            status_code=400,
            detail="End date cannot be earlier than start date."
        )

    db.commit()
    db.refresh(campaign)

    draft = None
    product = None

    if campaign.ad_draft_id:
        draft = (
            db.query(AdDraft)
            .filter(AdDraft.id == campaign.ad_draft_id)
            .first()
        )

    if campaign.product_id:
        product = (
            db.query(Product)
            .filter(Product.id == campaign.product_id)
            .first()
        )

    return {
        "message": "Campaign updated successfully.",
        "campaign": serialize_campaign(
            campaign,
            draft=draft,
            product=product,
        ),
    }


@router.delete("/{campaign_id}")
def delete_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    business = (
        db.query(Business)
        .filter(Business.user_id == current_user.id)
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business profile not found."
        )

    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.id == campaign_id,
            Campaign.business_id == business.id,
        )
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found."
        )

    db.delete(campaign)
    db.commit()

    return {
        "message": "Campaign deleted successfully."
    }

