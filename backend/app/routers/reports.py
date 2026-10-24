"""POST /reports (photo + GPS) and GET /reports"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services import image_service

router = APIRouter(prefix="/reports", tags=["reports"])

MAX_REPORTS_PER_HOUR = 5


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")  # set by Render's proxy
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("", response_model=schemas.ReportOut, status_code=201)
def create_report(
    request: Request,
    latitude: float = Form(..., ge=-90, le=90),
    longitude: float = Form(..., ge=-180, le=180),
    description: Optional[str] = Form(None, max_length=300),
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    ip = _client_ip(request)

    since = datetime.now(timezone.utc) - timedelta(hours=1)
    recent = (
        db.query(func.count(models.CitizenReport.id))
        .filter(models.CitizenReport.client_ip == ip,
                models.CitizenReport.created_at >= since)
        .scalar()
    )
    if recent >= MAX_REPORTS_PER_HOUR:
        raise HTTPException(429, f"Limit is {MAX_REPORTS_PER_HOUR} reports per hour. Try again later.")

    if not (photo.content_type or "").startswith("image/"):
        raise HTTPException(400, "Please upload an image file.")

    data = photo.file.read(image_service.MAX_BYTES + 1)
    try:
        result = image_service.estimate_turbidity(data)
    except image_service.InvalidImage as e:
        raise HTTPException(400, str(e))

    report = models.CitizenReport(
        latitude=latitude,
        longitude=longitude,
        photo_path=None,
        turbidity_score=result["score"],
        turbidity_label=result["label"],
        description=description,
        client_ip=ip,
        status="unverified",
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("", response_model=List[schemas.ReportOut])
def list_reports(limit: int = 500, db: Session = Depends(get_db)):
    limit = max(1, min(limit, 1000))
    return (
        db.query(models.CitizenReport)
        .order_by(models.CitizenReport.created_at.desc())
        .limit(limit)
        .all()
    )