# BizPilot AI

AI-powered business management and automation platform. Manage your business profile and products, upload product images, and generate ad drafts and campaigns with AI.

## Tech stack

- **Backend:** FastAPI, SQLAlchemy, PostgreSQL
- **Storage:** Supabase Storage (product images)
- **AI:** Google Gemini (ad generation)
- **Frontend:** Next.js, React, Tailwind CSS

## Project structure

```
bizpilot-ai/
├── backend/    # FastAPI app (app/api, app/models, app/schemas, app/services)
└── frontend/   # Next.js app
```

## Getting started

### 1. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create your environment file:

```bash
cp .env.example .env    # then fill in your own values
```

Run the API:

```bash
uvicorn app.main:app --reload
```

The API runs at http://127.0.0.1:8000 and interactive docs are at http://127.0.0.1:8000/docs.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at http://localhost:3000.

## Environment variables

See `backend/.env.example` for the full list. The real `.env` file is git-ignored and must never be committed.
