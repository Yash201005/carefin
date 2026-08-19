from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router

app = FastAPI(
    title="CareFin API",
    description="Backend services for CareFin - Indian Healthcare & Financial Guidance Platform",
    version="0.1.0"
)

# CORS configurations
# Allow localhost connections for Next.js dev server configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict this to actual origins in production configuration
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to CareFin API. Head to /api/health for system status."}
