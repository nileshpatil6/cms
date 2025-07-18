from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

# Enable CORS for all origins (for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.app.routers import auth, complaints, ai

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(complaints.router, prefix="/complaints", tags=["complaints"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])

@app.get("/")
async def read_root():
    return {"message": "Welcome to the POS Complaint Management System Backend!"}
