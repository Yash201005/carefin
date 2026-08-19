from fastapi import APIRouter

from app.api.endpoints import (
    advisor,
    auth,
    calculations,
    claims,
    documents,
    funding,
    health,
    hospitals,
    policy,
    schemes,
)

api_router = APIRouter()
api_router.include_router(health.router, prefix="", tags=["health"])
api_router.include_router(policy.router, prefix="/insurance", tags=["insurance"])
api_router.include_router(claims.router, prefix="/claims", tags=["claims"])
api_router.include_router(hospitals.router, prefix="/hospitals", tags=["hospitals"])
api_router.include_router(advisor.router, prefix="/insurance", tags=["insurance"])
api_router.include_router(schemes.router, prefix="/schemes", tags=["schemes"])
api_router.include_router(funding.router, prefix="/funding", tags=["funding"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(calculations.router, prefix="/calculations", tags=["calculations"])
