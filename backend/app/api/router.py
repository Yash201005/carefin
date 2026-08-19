from fastapi import APIRouter

from app.api.endpoints import health, policy

api_router = APIRouter()
api_router.include_router(health.router, prefix="", tags=["health"])
api_router.include_router(policy.router, prefix="/insurance", tags=["insurance"])
