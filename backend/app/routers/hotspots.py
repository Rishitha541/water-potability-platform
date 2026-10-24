"""GET /hotspots"""
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services import clustering_service

router = APIRouter(prefix="/hotspots", tags=["hotspots"])


@router.get("", response_model=List[schemas.HotspotOut])
def get_hotspots(
    radius_m: float = Query(500, ge=50, le=5000),
    min_reports: int = Query(3, ge=3, le=20),
    db: Session = Depends(get_db),
):
    points = []

    for r in db.query(models.CitizenReport).filter(
        models.CitizenReport.turbidity_label == "very_cloudy"
    ):
        points.append({"lat": r.latitude, "lon": r.longitude,
                       "source": r.client_ip or f"report-{r.id}"})

    for t in db.query(models.TestResult).filter(
        models.TestResult.verdict == "not_recommended",
        models.TestResult.latitude.isnot(None),
        models.TestResult.longitude.isnot(None),
    ):
        points.append({"lat": t.latitude, "lon": t.longitude, "source": f"test-{t.id}"})

    return clustering_service.find_hotspots(points, radius_m=radius_m, min_reports=min_reports)