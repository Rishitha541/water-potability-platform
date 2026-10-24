"""POST /predict"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services import advisory_service, ml_service

router = APIRouter(prefix="/predict", tags=["predict"])


@router.post("", response_model=schemas.PredictionOut)
def predict(payload: schemas.ReadingsIn, db: Session = Depends(get_db)):
    readings = {f: getattr(payload, f) for f in ml_service.FEATURES}

    ml = ml_service.predict(readings)                       # secondary signal
    flags = advisory_service.evaluate_readings(readings)    # primary signal
    verdict, message = advisory_service.decide_verdict(
        flags, ml["confident_potable"], ml["provided_count"]
    )

    record = models.TestResult(
        **{k.lower(): v for k, v in readings.items()},
        latitude=payload.latitude,
        longitude=payload.longitude,
        verdict=verdict,
        probability_potable=ml["probability_potable"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "verdict": verdict,
        "verdict_message": message,
        "probability_potable": ml["probability_potable"],
        "readings_provided": ml["provided_count"],
        "readings_missing": [advisory_service.LABELS[m] for m in ml["missing"]],
        "flags": flags,
        "disclaimer": advisory_service.DISCLAIMER,
    }