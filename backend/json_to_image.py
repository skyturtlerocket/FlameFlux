import json
import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from datetime import datetime
import requests
from PIL import Image
import numpy as np
from io import BytesIO
import math

def loadJSON(api_url):
    """Load JSON data from API endpoint"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        print(f"Fetching data from API: {api_url}")
        response = requests.get(api_url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from API: {e}")
        raise
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON response: {e}")
        raise

def fuck_epoch_time(epoch_ms):
    #convert milliseconds to seconds
    epoch_s = epoch_ms / 1000
    dt = datetime.fromtimestamp(epoch_s)
    return dt.strftime("%H:%M %d/%m")

def get_polygon_bounds(coordinates, geom_type):
    all_coords = []
    
    if geom_type == "Polygon":
        #for polygon, coordinates[0] is the outer ring
        all_coords = coordinates[0]
    elif geom_type == "MultiPolygon":
        #for multipolygon, flatten all coordinates
        for polygon in coordinates:
            all_coords.extend(polygon[0])  # outer ring of each polygon
    
    if not all_coords:
        return None
    
    longs = [coord[0] for coord in all_coords]
    lats = [coord[1] for coord in all_coords]
    
    return {
        'min_lon': min(longs),
        'max_lon': max(longs),
        'min_lat': min(lats),
        'max_lat': max(lats)
    }

def deg2num(lat_deg, lon_deg, zoom):
    #convert to tile numbers
    lat_rad = math.radians(lat_deg)
    n = 2.0 ** zoom
    xtile = int((lon_deg + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return (xtile, ytile)

def num2deg(xtile, ytile, zoom):
    #convert tile numbers to latitude and longitude
    n = 2.0 ** zoom
    lon_deg = xtile / n * 360.0 - 180.0
    lat_rad = math.atan(math.sinh(math.pi * (1 - 2 * ytile / n)))
    lat_deg = math.degrees(lat_rad)
    return (lat_deg, lon_deg)

def get_satellite_tiles(bounds, zoom=15):
    #get satelllite data
    min_x, max_y = deg2num(bounds['min_lat'], bounds['min_lon'], zoom)
    max_x, min_y = deg2num(bounds['max_lat'], bounds['max_lon'], zoom)
    
    tiles = []
    for x in range(min_x, max_x + 1):
        for y in range(min_y, max_y + 1):
            tiles.append((x, y, zoom))
    
    return tiles, (min_x, max_x, min_y, max_y)

def download_tile(x, y, z):
    #get the satellite tiles
    url = f"https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return Image.open(BytesIO(response.content))
    except Exception as e:
        print(f"Error downloading tile {x},{y},{z}: {e}")
        # Fallback to Bing satellite tiles
        try:
            bing_url = f"https://ecn.t3.tiles.virtualearth.net/tiles/a{quadkey_from_tile(x, y, z)}.jpeg?g=1"
            response = requests.get(bing_url, headers=headers, timeout=10)
            response.raise_for_status()
            return Image.open(BytesIO(response.content))
        except:
            # Final fallback to OpenStreetMap
            try:
                osm_url = f"https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                response = requests.get(osm_url, headers=headers, timeout=10)
                response.raise_for_status()
                return Image.open(BytesIO(response.content))
            except:
                # Return a blank tile as final fallback
                return Image.new('RGB', (256, 256), color='lightgray')

def quadkey_from_tile(x, y, z):
    """Convert tile coordinates to Bing quadkey"""
    quadkey = ""
    for i in range(z, 0, -1):
        digit = 0
        mask = 1 << (i - 1)
        if (x & mask) != 0:
            digit += 1
        if (y & mask) != 0:
            digit += 2
        quadkey += str(digit)
    return quadkey

def create_base_map(bounds, target_size=(800, 600)):
    """Create base satellite map for given bounds"""
    zoom = 15
    tiles, (min_x, max_x, min_y, max_y) = get_satellite_tiles(bounds, zoom)
    
    map_width = (max_x - min_x + 1) * 256
    map_height = (max_y - min_y + 1) * 256
    
    base_img = Image.new('RGB', (map_width, map_height))

    print(f"downloading {len(tiles)} satellite tiles...")
    for x in range(min_x, max_x + 1):
        for y in range(min_y, max_y + 1):
            tile = download_tile(x, y, zoom)
            paste_x = (x - min_x) * 256
            paste_y = (y - min_y) * 256
            base_img.paste(tile, (paste_x, paste_y))
    
    #calculate actual bounds of the stitched image
    top_left_lat, top_left_lon = num2deg(min_x, min_y, zoom)
    bottom_right_lat, bottom_right_lon = num2deg(max_x + 1, max_y + 1, zoom)
    
    map_bounds = {
        'min_lon': top_left_lon,
        'max_lon': bottom_right_lon,
        'min_lat': bottom_right_lat,
        'max_lat': top_left_lat
    }
    
    return base_img, map_bounds

def coords_to_pixels(coords, map_bounds, img_width, img_height):
    #convert graphics to pixels
    pixels = []
    for lon, lat in coords:
        #make coordinates normal
        x_norm = (lon - map_bounds['min_lon']) / (map_bounds['max_lon'] - map_bounds['min_lon'])
        y_norm = (map_bounds['max_lat'] - lat) / (map_bounds['max_lat'] - map_bounds['min_lat'])
        
        #convert to pixel coordinates
        x_pixel = x_norm * img_width
        y_pixel = y_norm * img_height
        pixels.append([x_pixel, y_pixel])
    return pixels

def expand_bounds(bounds, factor=2.2):
    """Expand bounds to ensure polygon takes up 40-50% of image"""
    center_lon = (bounds['min_lon'] + bounds['max_lon']) / 2
    center_lat = (bounds['min_lat'] + bounds['max_lat']) / 2
    
    width = bounds['max_lon'] - bounds['min_lon']
    height = bounds['max_lat'] - bounds['min_lat']
    
    expanded_width = width * factor
    expanded_height = height * factor
    
    return {
        'min_lon': center_lon - expanded_width / 2,
        'max_lon': center_lon + expanded_width / 2,
        'min_lat': center_lat - expanded_height / 2,
        'max_lat': center_lat + expanded_height / 2
    }

def processGeoJSON(api_url, output_dir="output"):
    os.makedirs(output_dir, exist_ok=True)
    data = loadJSON(api_url)
    
    if data['type'] != 'FeatureCollection':
        print("Error: Expected FeatureCollection")
        return
    
    print(f"Processing {len(data['features'])} features...")
    
    for i, feature in enumerate(data['features']):
        try:
            print(f"Processing feature {i+1}/{len(data['features'])}")
            
            # Extract geometry and properties
            geometry = feature['geometry']
            properties = feature['properties']
            
            # Get bounds
            bounds = get_polygon_bounds(geometry['coordinates'], geometry['type'])
            if not bounds:
                print(f"Skipping feature {i+1}: No valid coordinates")
                continue
            
            # Expand bounds so polygon takes up 40-50% of image
            expanded_bounds = expand_bounds(bounds, factor=2.2)
            
            # Create base satellite map
            base_img, map_bounds = create_base_map(expanded_bounds)
            
            # Create matplotlib figure
            fig, ax = plt.subplots(1, 1, figsize=(10, 8))
            ax.imshow(base_img, extent=[
                map_bounds['min_lon'], map_bounds['max_lon'],
                map_bounds['min_lat'], map_bounds['max_lat']
            ])
            
            # Draw polygon(s) outline only
            if geometry['type'] == 'Polygon':
                coords = geometry['coordinates'][0]  # outer ring
                lons = [coord[0] for coord in coords]
                lats = [coord[1] for coord in coords]
                ax.plot(lons, lats, color='red', linewidth=2, alpha=0.9)
                
            elif geometry['type'] == 'MultiPolygon':
                for polygon in geometry['coordinates']:
                    coords = polygon[0]  # outer ring of each polygon
                    lons = [coord[0] for coord in coords]
                    lats = [coord[1] for coord in coords]
                    ax.plot(lons, lats, color='red', linewidth=2, alpha=0.9)
            
            #set map extent
            ax.set_xlim(map_bounds['min_lon'], map_bounds['max_lon'])
            ax.set_ylim(map_bounds['min_lat'], map_bounds['max_lat'])
            
            #format time
            if 'poly_DateCurrent' in properties:
                formatted_time = fuck_epoch_time(properties['poly_DateCurrent'])
            else:
                formatted_time = "N/A"
            
            #get incident name or ID
            incident_name = properties['poly_IncidentName']
            
            #add labels in top right corner with enhanced styling
            ax.text(0.98, 0.98, f"{formatted_time}\n{incident_name}", 
                   transform=ax.transAxes, fontsize=12, weight='bold',
                   horizontalalignment='right', verticalalignment='top',
                   bbox=dict(boxstyle="round,pad=0.5", facecolor="white", alpha=0.9, edgecolor='black'))
            
            #remove axes
            ax.set_xticks([])
            ax.set_yticks([])
            ax.set_aspect('equal')
            
            #save image
            filename = f"{incident_name.replace(' ', '_')}_{properties.get('id', i+1)}.png"
            filepath = os.path.join(output_dir, filename)
            plt.savefig(filepath, dpi=300, bbox_inches='tight', pad_inches=0.1)
            plt.close()
            print(f"Saved: {filepath}")
        except Exception as e:
            print(f"Error processing feature {i+1}: {e}")
            continue
    print(f"Processing complete! Images saved to {output_dir}/")

if __name__ == "__main__":
    api_url = "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson"
    processGeoJSON(api_url)