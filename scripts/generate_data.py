#!/usr/bin/env python3
"""
Snapshot live wildfire + satellite data into static JSON for the website.

This is the "backend, precomputed": instead of every visitor's browser calling
the ArcGIS APIs on page load, this script (run by the 30-minute automation)
fetches and processes the data once and writes ready-to-render files into
frontend/public/data/. Vercel serves them from its CDN, so the page loads fast.

The processing here mirrors the frontend's fireApiDirect.js / satelliteApiDirect.js
exactly, so the output is a drop-in replacement for those live API calls.

Resilience: each source is fetched independently. If a source fails, its
existing JSON file is left untouched rather than blanked, so a transient API
hiccup never wipes the site's data.
"""

import json
import os
import sys
from datetime import datetime

import requests

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "..", "frontend", "public", "data")
DATA_DIR = os.path.abspath(DATA_DIR)

# ---------------------------------------------------------------------------
# Source APIs
# ---------------------------------------------------------------------------
WFIGS_API = (
    "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/"
    "WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query"
    "?outFields=*&where=1%3D1&f=geojson"
)
MODIS_API = (
    "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/"
    "MODIS_Thermal_v1/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson"
)
VIIRS_API = (
    "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/"
    "Satellite_VIIRS_Thermal_Hotspots_and_Fire_Activity/FeatureServer/0/query"
    "?outFields=*&where=1%3D1&f=geojson"
)
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    )
}
TIMEOUT = 60


# ---------------------------------------------------------------------------
# Shared helpers (mirror the frontend logic)
# ---------------------------------------------------------------------------
COORD_PRECISION = 5  # decimal degrees (~1.1 m) — plenty for fire perimeters, keeps files small


def round_coords(obj):
    """Recursively round every number in a nested coordinate array."""
    if isinstance(obj, (int, float)):
        return round(obj, COORD_PRECISION)
    if isinstance(obj, list):
        return [round_coords(x) for x in obj]
    return obj


def calc_center(coordinates, geom_type):
    all_coords = []
    if geom_type == "Polygon":
        all_coords = coordinates[0]
    elif geom_type == "MultiPolygon":
        for polygon in coordinates:
            all_coords.extend(polygon[0])
    if not all_coords:
        return None
    lng_sum = sum(c[0] for c in all_coords)
    lat_sum = sum(c[1] for c in all_coords)
    return [lng_sum / len(all_coords), lat_sum / len(all_coords)]


def severity_from_size(area):
    if area >= 10000:
        return "High"
    if area >= 1000:
        return "Medium"
    return "Low"


def is_alaska_fire(lat, lng):
    return 51.0 <= lat <= 72.0 and -173.0 <= lng <= -130.0


def is_in_usa(lat, lon):
    return (
        (24.396308 <= lat <= 49.384358 and -125.0 <= lon <= -66.93457)
        or (51.2 <= lat <= 71.5 and -179.15 <= lon <= -129.97)
        or (18.5 <= lat <= 22.5 and -160.5 <= lon <= -154.5)
    )


def get_latest_fires_by_name(features):
    """Keep only the most recent perimeter per incident, within the last 48h."""
    fire_map = {}
    cutoff = datetime.now().timestamp() * 1000 - (48 * 60 * 60 * 1000)
    for feature in features:
        props = feature.get("properties", {})
        name = props.get("poly_IncidentName") or props.get("incident_name")
        date_ms = props.get("poly_DateCurrent") or 0
        if not name or date_ms < cutoff:
            continue
        existing = fire_map.get(name)
        if existing is None or date_ms > (existing.get("properties", {}).get("poly_DateCurrent") or 0):
            fire_map[name] = feature
    return list(fire_map.values())


def write_json(filename, payload):
    os.makedirs(DATA_DIR, exist_ok=True)
    path = os.path.join(DATA_DIR, filename)
    # Write to a temp file then rename, so readers never see a half-written file.
    tmp = path + ".tmp"
    with open(tmp, "w") as fh:
        json.dump(payload, fh, separators=(",", ":"))
    os.replace(tmp, path)
    print(f"  wrote {filename} ({os.path.getsize(path):,} bytes)")


# ---------------------------------------------------------------------------
# Fires (WFIGS perimeters)
# ---------------------------------------------------------------------------
def build_fires():
    resp = requests.get(WFIGS_API, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    if not data or data.get("type") != "FeatureCollection":
        raise ValueError("Invalid fire data format - expected FeatureCollection")

    features = data.get("features", [])
    latest = get_latest_fires_by_name(features)
    fires = []
    for i, feature in enumerate(latest):
        geometry = feature.get("geometry") or {}
        props = feature.get("properties") or {}
        coords = geometry.get("coordinates")
        if not coords:
            continue
        center = calc_center(coords, geometry.get("type"))
        if not center:
            continue

        epoch_ms = props.get("poly_DateCurrent")
        last_update = datetime.fromtimestamp(epoch_ms / 1000).isoformat() if epoch_ms else None

        area = round(props.get("poly_Acres_AutoCalc") or 0)
        containment = (
            props.get("attr_PercentContained")
            if props.get("attr_PercentContained") is not None
            else props.get("poly_PercentContained")
            if props.get("poly_PercentContained") is not None
            else props.get("percent_contained")
        )

        fire = {
            "id": props.get("OBJECTID") or f"fire_{i + 1}",
            "name": props.get("poly_IncidentName") or f"Fire_{i + 1}",
            "lat": center[1],
            "lng": center[0],
            "size": area,
            "containment": containment,
            "severity": severity_from_size(area),
            "lastUpdate": last_update,
            "weather": None,
            "geometry": {"type": geometry.get("type"), "coordinates": round_coords(coords)},
        }
        if is_alaska_fire(fire["lat"], fire["lng"]):
            continue
        fires.append(fire)

    return {
        "generatedAt": datetime.now().isoformat(),
        "count": len(fires),
        "fires": fires,
    }


# ---------------------------------------------------------------------------
# Satellite hotspots (MODIS / VIIRS)
# ---------------------------------------------------------------------------
def build_modis():
    resp = requests.get(MODIS_API, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    features = resp.json().get("features", [])
    hotspots = []
    for val in features:
        props = val.get("properties", {})
        lng, lat = val["geometry"]["coordinates"][0], val["geometry"]["coordinates"][1]
        if not is_in_usa(lat, lng):
            continue
        confidence = props.get("CONFIDENCE")
        if confidence is None or confidence < 80:
            continue
        hotspots.append(
            {
                "id": val.get("id"),
                "latitude": lat,
                "longitude": lng,
                "age": props.get("HOURS_OLD"),
                "confidence": confidence,
                "intensity": props.get("FRP"),
                "source": "MODIS",
            }
        )
    return {"generatedAt": datetime.now().isoformat(), "count": len(hotspots), "hotspots": hotspots}


def build_viirs():
    resp = requests.get(VIIRS_API, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    features = resp.json().get("features", [])
    hotspots = []
    for val in features:
        props = val.get("properties", {})
        lng, lat = val["geometry"]["coordinates"][0], val["geometry"]["coordinates"][1]
        if not is_in_usa(lat, lng):
            continue
        hotspots.append(
            {
                "id": val.get("id"),
                "latitude": lat,
                "longitude": lng,
                "age": props.get("hours_old"),
                "confidence": None,
                "intensity": props.get("frp"),
                "source": "VIIRS",
            }
        )
    return {"generatedAt": datetime.now().isoformat(), "count": len(hotspots), "hotspots": hotspots}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    sources = [
        ("fires", "fires.json", build_fires, "fires"),
        ("MODIS", "modis.json", build_modis, "hotspots"),
        ("VIIRS", "viirs.json", build_viirs, "hotspots"),
    ]
    failures = 0
    for label, filename, builder, key in sources:
        try:
            print(f"Fetching {label} ...")
            payload = builder()
            write_json(filename, payload)
            print(f"  {label}: {payload['count']} {key}")
        except Exception as exc:  # noqa: BLE001 - keep going, leave old file in place
            failures += 1
            print(f"  ERROR fetching {label}: {exc} (keeping previous {filename})", file=sys.stderr)

    # Non-zero exit only if everything failed, so the pipeline can still push
    # partial updates but a total outage is visible in the logs.
    return 1 if failures == len(sources) else 0


if __name__ == "__main__":
    sys.exit(main())
