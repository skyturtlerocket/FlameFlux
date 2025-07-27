import json
import requests
from datetime import datetime

MODIS_api = "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/MODIS_Thermal_v1/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson"
VIIRS_api = "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Satellite_VIIRS_Thermal_Hotspots_and_Fire_Activity/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson"

headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}

def get_modis_data():
    """Get MODIS satellite data"""
    modis_hotspots = []
    
    MODIS_response = requests.get(MODIS_api, headers=headers)
    MODIS_data = MODIS_response.json()
    
    MODIS_features = MODIS_data["features"]
    
    for idx, val in enumerate(MODIS_features):
        id = val["id"]
        
        props = val["properties"]
        lat, long = val['geometry']['coordinates'][1], val['geometry']['coordinates'][0]
        
        # add check for if its in bounds or not
        is_in_usa = lambda lat, lon: (
            (24.396308 <= lat <= 49.384358 and -125.0 <= lon <= -66.93457) or
            (51.2 <= lat <= 71.5 and -179.15 <= lon <= -129.97) or
            (18.5 <= lat <= 22.5 and -160.5 <= lon <= -154.5)
        )
        if is_in_usa(lat, long) == False:
            continue
        
        age = props["HOURS_OLD"]
        
        confidence = props["CONFIDENCE"]
        if confidence < 80:
            continue
        
        intensity = props["FRP"]
        
        hotspot = {
            "id": id,
            "latitude": lat,
            "longitude": long,
            "age": age,
            "confidence": confidence,
            "intensity": intensity,
            "source": "MODIS"
        }
        
        modis_hotspots.append(hotspot)
    
    return {
        "hotspots": modis_hotspots,
        "total": len(modis_hotspots),
        "source": "MODIS",
        "timestamp": datetime.now().isoformat()
    }

def get_viirs_data():
    """Get VIIRS satellite data"""
    viirs_hotspots = []
    
    VIIRS_response = requests.get(VIIRS_api, headers=headers)
    VIIRS_data = VIIRS_response.json()
    
    VIIRS_features = VIIRS_data["features"]
    
    for idx, val in enumerate(VIIRS_features):
        id = val["id"]
        
        props = val["properties"]
        lat, long = val['geometry']['coordinates'][1], val['geometry']['coordinates'][0]
        
        # add check for if its in bounds or not
        is_in_usa = lambda lat, lon: (
            (24.396308 <= lat <= 49.384358 and -125.0 <= lon <= -66.93457) or
            (51.2 <= lat <= 71.5 and -179.15 <= lon <= -129.97) or
            (18.5 <= lat <= 22.5 and -160.5 <= lon <= -154.5)
        )
        if is_in_usa(lat, long) == False:
            continue
        
        age = props["hours_old"]
        intensity = props["frp"]
        
        hotspot = {
            "id": id,
            "latitude": lat,
            "longitude": long,
            "age": age,
            "confidence": None,  # VIIRS doesn't seem to have confidence in the original code
            "intensity": intensity,
            "source": "VIIRS"
        }
        
        viirs_hotspots.append(hotspot)
    
    return {
        "hotspots": viirs_hotspots,
        "total": len(viirs_hotspots),
        "source": "VIIRS",
        "timestamp": datetime.now().isoformat()
    }