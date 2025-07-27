import json
import requests
from datetime import datetime

def calcCenter(coordinates, geom_type):
    all_coords = []
    if geom_type == "Polygon":
        all_coords = coordinates[0] 
    elif geom_type == "MultiPolygon":
        for polygon in coordinates:
            all_coords.extend(polygon[0])

    if not all_coords:
        return None

    lng_sum = sum(coord[0] for coord in all_coords)
    lat_sum = sum(coord[1] for coord in all_coords)
    return [lng_sum / len(all_coords), lat_sum / len(all_coords)]

def get_severity_from_size(area):
    if area >= 10000:
        return "High"
    elif area >= 1000:
        return "Medium"
    else:
        return "Low"

def is_alaska_fire(lat, lng):
    """
    Check if a fire is in Alaska based on geographic bounds.
    Alaska roughly spans from 51°N to 72°N latitude and 130°W to 173°E longitude.
    """
    # Alaska bounds (approximate)
    alaska_bounds = {
        'lat_min': 51.0,
        'lat_max': 72.0,
        'lng_min': -173.0,
        'lng_max': -130.0
    }
    
    return (alaska_bounds['lat_min'] <= lat <= alaska_bounds['lat_max'] and
            alaska_bounds['lng_min'] <= lng <= alaska_bounds['lng_max'])

def get_latest_fires_by_name(features):
    fire_map = {}
    cutoff = datetime.now().timestamp() * 1000 - (24 * 60 * 60 * 1000) # last 24 hours only
    
    for feature in features:
        properties = feature.get('properties', {})
        name = properties.get('poly_IncidentName') or properties.get('incident_name')
        date_ms = properties.get('poly_DateCurrent', 0)
        
        if not name or date_ms < cutoff:
            continue

        if name not in fire_map or date_ms > fire_map[name]['properties'].get('poly_DateCurrent', 0):
            fire_map[name] = feature
    return list(fire_map.values())

def get_fires_data():
    api_url = "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson"
    headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    print(f"Fetching data from API: {api_url}")
    response = requests.get(api_url, headers=headers, timeout=30)
    response.raise_for_status()
    data = response.json()

    if not data or data.get('type') != 'FeatureCollection':
        raise ValueError('Invalid data format - expected FeatureCollection')

    features = data.get('features', [])
    if not features:
        return {'fires': [], 'total': 0, 'timestamp': datetime.now().isoformat()}

    latest_features = get_latest_fires_by_name(features)
    processed_fires = []

    for i, feature in enumerate(latest_features):
        print(f"Processing feature {i+1}/{len(latest_features)}")
        
        geometry = feature.get('geometry', {})
        properties = feature.get('properties', {})
        
        if not geometry or not geometry.get('coordinates'):
            print(f"Skipping feature {i+1}: No valid geometry")
            continue
        coords = geometry['coordinates']
        center = calcCenter(coords, geometry['type'])
        
        if not center:
            print(f"Skipping feature {i+1}: Could not calculate center")
            continue

        incident_name = properties.get('poly_IncidentName', f'Fire_{i+1}')
        epoch_ms = properties.get('poly_DateCurrent')
        if epoch_ms:
            epoch_s = epoch_ms / 1000
            dt = datetime.fromtimestamp(epoch_s)
            last_update = dt.isoformat()
        else:
            last_update = None

        area = round(properties.get('poly_Acres_AutoCalc', 0), 2)
        severity = get_severity_from_size(area)

        fire_data = {
            "id": properties.get('OBJECTID') or f"fire_{i+1}",
            "name": incident_name,
            "lat": center[1],
            "lng": center[0],
            "size": area,
            "containment": properties.get('poly_PercentContained'),
            "severity": severity,
            "lastUpdate": last_update,
            "weather": None,  # to be implemented 
            "geometry": {
                "type": geometry['type'],
                "coordinates": coords
            }
        }
        processed_fires.append(fire_data)

    print(f"Successfully processed {len(processed_fires)} fires")
    
    # Filter out Alaska fires
    filtered_fires = [fire for fire in processed_fires if not is_alaska_fire(fire['lat'], fire['lng'])]
    alaska_count = len(processed_fires) - len(filtered_fires)
    print(f"Filtered out {alaska_count} Alaska fires")
    
    return {
        'fires': filtered_fires,
        'total': len(filtered_fires),
        'timestamp': datetime.now().isoformat()
    }