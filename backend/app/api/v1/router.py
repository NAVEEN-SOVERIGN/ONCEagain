from fastapi import APIRouter
from app.api.v1 import (
    patients,
    screenings,
    questionnaires,
    clinical_assessments,
    functional_tests,
    sensors,
    features,
    flags,
    risk_assessments,
    red_flags,
    reviews,
    reports,
    simulation,
    sync
)

api_router = APIRouter()

api_router.include_router(patients.router)
api_router.include_router(screenings.router)
api_router.include_router(questionnaires.router)
api_router.include_router(clinical_assessments.router)
api_router.include_router(functional_tests.router)
api_router.include_router(sensors.router)
api_router.include_router(features.router)
api_router.include_router(flags.router)
api_router.include_router(risk_assessments.router)
api_router.include_router(red_flags.router)
api_router.include_router(reviews.router)
api_router.include_router(reports.router)
api_router.include_router(simulation.router)
api_router.include_router(sync.router)
