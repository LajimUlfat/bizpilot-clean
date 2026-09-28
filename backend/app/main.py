from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from app.database.database import Base, engine

from app.models.user import User
from app.models.business import Business
from app.models.product import Product
from app.models.product_image import ProductImage

from app.api.auth import router as auth_router
from app.api.business import router as business_router
from app.api.product import router as product_router
from app.api.product_image import router as product_image_router

from app.api.ai import router as ai_router

from app.models.ad_draft import AdDraft
from app.api.ad_draft import router as ad_draft_router

from app.models.campaign import Campaign
from app.api.campaign import router as campaign_router


# =========================================================
# DATABASE
# =========================================================

# Create all database tables
Base.metadata.create_all(bind=engine)


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="BizPilot AI",
    description="AI-powered business management and automation platform",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# STATIC FILES
# =========================================================

# # Product image uploads
# app.mount(
#     "/uploads",
#     StaticFiles(directory="uploads"),
#     name="uploads"
# )


# =========================================================
# API ROUTERS
# =========================================================

app.include_router(auth_router)
app.include_router(business_router)
app.include_router(product_router)
app.include_router(product_image_router)

app.include_router(ai_router)
app.include_router(ad_draft_router)

app.include_router(campaign_router)

# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Welcome to BizPilot AI 🚀",
        "status": "running"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


# =========================================================
# DATABASE TEST
# =========================================================

@app.get("/db-test")
def database_test():
    try:
        with engine.connect():
            return {
                "status": "success",
                "message": "PostgreSQL connected successfully"
            }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }