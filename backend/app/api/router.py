from fastapi import APIRouter

from app.api.endpoints import claims, health, hospitals, policy

api_router = APIRouter()
api_router.include_router(health.router, prefix="", tags=["health"])
api_router.include_router(policy.router, prefix="/insurance", tags=["insurance"])
api_router.include_router(claims.router, prefix="/claims", tags=["claims"])
api_router.include_router(hospitals.router, prefix="/hospitals", tags=["hospitals"])
