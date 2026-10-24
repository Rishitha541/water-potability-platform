"""Request/response formats."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

FEATURES = [
    "ph", "Hardness", "Solids", "Chloramines", "Sulfate",
    "Conductivity", "Organic_carbon", "Trihalomethanes", "Turbidity",
]


class ReadingsIn(BaseModel):
    """Body of POST /predict. Every reading is optional, but at least 3 are needed."""
    ph: Optional[float] = Field(None, ge=0, le=14)
    Hardness: Optional[float] = Field(None, ge=0)          # mg/L
    Solids: Optional[float] = Field(None, ge=0)            # ppm (TDS)
    Chloramines: Optional[float] = Field(None, ge=0)       # mg/L
    Sulfate: Optional[float] = Field(None, ge=0)           # mg/L
    Conductivity: Optional[float] = Field(None, ge=0)      # µS/cm
    Organic_carbon: Optional[float] = Field(None, ge=0)    # mg/L
    Trihalomethanes: Optional[float] = Field(None, ge=0)   # µg/L
    Turbidity: Optional[float] = Field(None, ge=0)         # NTU

    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)

    @model_validator(mode="after")
    def enough_readings(self):
        provided = sum(getattr(self, f) is not None for f in FEATURES)
        if provided < 3:
            raise ValueError("Enter at least 3 of the 9 readings.")
        return self


class Flag(BaseModel):
    parameter: str
    value: float
    unit: str
    level: str        # "breach" (outside limit) or "caution" (above ideal)
    status: str
    limit: str
    drinking: str
    skin_hair: str


class PredictionOut(BaseModel):
    id: int
    verdict: str                  # not_recommended | uncertain | no_issues_found
    verdict_message: str
    probability_potable: float    # model's secondary signal
    readings_provided: int
    readings_missing: List[str]
    flags: List[Flag]
    disclaimer: str


class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    latitude: float
    longitude: float
    photo_path: Optional[str] = None
    turbidity_score: Optional[float] = None
    turbidity_label: Optional[str] = None
    description: Optional[str] = None
    status: str
    created_at: datetime


class HotspotOut(BaseModel):
    cluster_id: int
    latitude: float
    longitude: float
    report_count: int
    radius_m: float