"""Database tables."""
from sqlalchemy import Column, DateTime, Float, Integer, String, func

from app.database import Base


class TestResult(Base):
    """One /predict call: the readings entered plus the verdict we returned."""
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ph = Column(Float)
    hardness = Column(Float)
    solids = Column(Float)
    chloramines = Column(Float)
    sulfate = Column(Float)
    conductivity = Column(Float)
    organic_carbon = Column(Float)
    trihalomethanes = Column(Float)
    turbidity = Column(Float)

    latitude = Column(Float)      # optional: lets a test appear on the map
    longitude = Column(Float)

    verdict = Column(String(20))  # not_recommended | uncertain | no_issues_found
    probability_potable = Column(Float)


class CitizenReport(Base):
    """A photo + GPS report from a citizen (used in the reports batch)."""
    __tablename__ = "citizen_reports"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    photo_path = Column(String(255))
    turbidity_score = Column(Float)      # rough estimate from the photo
    turbidity_label = Column(String(20)) # clear | slightly_cloudy | very_cloudy
    description = Column(String(300))

    client_ip = Column(String(45))       # for rate limiting
    status = Column(String(20), nullable=False, default="unverified",
                    server_default="unverified")