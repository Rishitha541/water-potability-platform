"""Seeds SIMULATED citizen reports for the demo.  Run from backend:  python seed_demo.py"""
import random

from app import models
from app.database import Base, SessionLocal, engine

random.seed(7)
Base.metadata.create_all(bind=engine)

CENTRES = [(17.3616, 78.4747), (17.4399, 78.4983), (17.4948, 78.3996)]  # 3 problem areas
db = SessionLocal()
db.query(models.CitizenReport).filter(models.CitizenReport.status == "simulated").delete()

n = 0


def add(lat, lon, label, score):
    global n
    n += 1
    db.add(models.CitizenReport(
        latitude=lat, longitude=lon, turbidity_label=label, turbidity_score=score,
        description="Simulated demo report", client_ip=f"sim-{n % 4}", status="simulated",
    ))


for lat, lon in CENTRES:                      # 8 cloudy reports around each centre
    for _ in range(8):
        add(lat + random.uniform(-0.002, 0.002), lon + random.uniform(-0.002, 0.002),
            "very_cloudy", round(random.uniform(0.7, 0.95), 2))

for _ in range(8):                            # scattered clear reports elsewhere
    add(random.uniform(17.30, 17.55), random.uniform(78.30, 78.60),
        "clear", round(random.uniform(0.05, 0.3), 2))

db.commit()
print(f"Seeded {n} simulated reports.")