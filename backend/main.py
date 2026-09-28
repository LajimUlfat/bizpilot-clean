from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {
        "message": "BizPilot AI Backend is running!"
    }