import json
import requests
from datetime import datetime
"""
@return format

{
    id: properties.id || `fire_${index + 1}`,
    name: name,
    lat: center.lat,
    lng: center.lng,
    size: size,
    containment: properties.containment || null,
    severity: severity,
    lastUpdate: lastUpdate,
    weather: null, // Will be implemented later
    geometry: geometry // Store the geometry for polygon rendering
}
"""
def calcCenter(coordinates, geom_type):
    all_coords = []

    if geom_type == "Polygon":
        all_coords = coordinates[0]  # outer ring
    elif geom_type == "MultiPolygon":
        for polygon in coordinates:
            all_coords.extend(polygon[0])  # outer ring of each polygon

    if not all_coords:
        return None

    lng_sum = sum(coord[0] for coord in all_coords)
    lat_sum = sum(coord[1] for coord in all_coords)

    return [lng_sum / len(all_coords), lat_sum / len(all_coords)]

api_url = "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson"

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

try:
    print(f"Fetching data from API: {api_url}")
    response = requests.get(api_url, headers=headers, timeout=30)
    response.raise_for_status()
    data = response.json()

except requests.exceptions.RequestException as e:
    print(f"Error fetching data from API: {e}")
    raise

except json.JSONDecodeError as e:
    print(f"Error parsing JSON response: {e}")
    raise

count = 0

for i, feature in enumerate(data['features']):
        try:
            print(f"Processing feature {i+1}/{len(data['features'])}")
            ID = feature['id']
            geometry = feature['geometry']
            coords = geometry['coordinates']
            properties = feature['properties']

            epoch_ms = properties['poly_DateCurrent']
            epoch_s = epoch_ms / 1000
            dt = datetime.fromtimestamp(epoch_s)
            lastUpdate = dt.strftime("%H:%M, %m/%d")
            center = calcCenter(coords, geometry['type'])
            type = geometry['type']
            cLong = center[0]
            cLat = center[1]
            incident_name = properties['poly_IncidentName']
            
            area = round(properties['poly_Acres_AutoCalc'],2)
            if area >= 10000:
                severity = "High"
            if (area >= 1000):
                severity = "Medium"
            else:
                severity = "Low"

            returnData = {
                "id": ID,
                "coords": coords,
                "name": incident_name,
                "lat": cLat,
                "lng": cLong,
                "size": area,
                "containment": None,
                "severity": severity,
                "lastUpdate": lastUpdate,
                "weather": None,
                "geometry": geometry['type']
            }
            
            #has all needed information for hte fires!
            jsonData = json.dumps(returnData)


        except Exception as e:
            print(f"Error processing feature {i+1}: {e}")
            continue