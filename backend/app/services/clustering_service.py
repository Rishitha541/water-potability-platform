"""DBSCAN hotspot detection on GPS points (haversine distance)."""
import math

import numpy as np
from sklearn.cluster import DBSCAN

EARTH_RADIUS_M = 6_371_000


def _haversine_m(lat1, lon1, lat2, lon2) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def find_hotspots(points: list, radius_m: float = 500,
                  min_reports: int = 3, min_sources: int = 2) -> list:
    if len(points) < min_reports:
        return []

    coords = np.radians([[p["lat"], p["lon"]] for p in points])
    labels = DBSCAN(
        eps=radius_m / EARTH_RADIUS_M,
        min_samples=min_reports,
        metric="haversine",
        algorithm="ball_tree",
    ).fit_predict(coords)

    hotspots = []
    for label in sorted(set(labels) - {-1}):
        members = [points[i] for i in np.where(labels == label)[0]]
        if len({m["source"] for m in members}) < min_sources:
            continue
        lat = sum(m["lat"] for m in members) / len(members)
        lon = sum(m["lon"] for m in members) / len(members)
        radius = max(_haversine_m(lat, lon, m["lat"], m["lon"]) for m in members)
        hotspots.append({
            "cluster_id": len(hotspots) + 1,
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "report_count": len(members),
            "radius_m": round(max(radius, 50), 1),
        })
    return hotspots