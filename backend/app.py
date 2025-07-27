from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys
from datetime import datetime
import logging
import json

# Add the services directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'services'))

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

logger.info("Starting Flask application initialization...")

# Import the services
try:
    from fire_service import get_fires_data
    from satellite_service import get_modis_data, get_viirs_data
    logger.info("Successfully imported all services")
except ImportError as e:
    logger.error(f"Error importing services: {e}")
    print(f"Error importing services: {e}")
    sys.exit(1)

# Initialize Flask app
app = Flask(__name__)
logger.info("Flask app initialized")

# Enable CORS for all routes (adjust origins for production)
CORS(app)
logger.info("CORS enabled")

# Simple test route
@app.route('/test')
def test():
    """Simple test endpoint"""
    logger.info("Test endpoint called")
    return jsonify({
        'message': 'Flask app is working!',
        'timestamp': datetime.now().isoformat()
    })



# Cache for fire data to avoid too many API calls
fire_data_cache = {
    'data': None,
    'timestamp': None,
    'cache_duration': 300  # 5 minutes in seconds
}

# Cache for satellite data
satellite_data_cache = {
    'modis': {'data': None, 'timestamp': None},
    'viirs': {'data': None, 'timestamp': None},
    'cache_duration': 300  # 5 minutes in seconds
}

def is_cache_valid(cache_timestamp):
    """Check if the cached data is still valid"""
    if not cache_timestamp:
        return False
    
    current_time = datetime.now().timestamp()
    return (current_time - cache_timestamp) < fire_data_cache['cache_duration']

def is_satellite_cache_valid(satellite_type):
    """Check if the satellite cache is still valid"""
    cache_data = satellite_data_cache.get(satellite_type)
    if not cache_data or not cache_data['data'] or not cache_data['timestamp']:
        return False
    
    current_time = datetime.now().timestamp()
    return (current_time - cache_data['timestamp']) < satellite_data_cache['cache_duration']

@app.route('/')
def index():
    """Basic health check endpoint"""
    return jsonify({
        'status': 'Wildfire Dashboard API is running',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'cache_status': 'valid' if is_cache_valid(fire_data_cache['timestamp']) else 'expired'
    })

@app.route('/api/fires', methods=['GET'])
def get_fires():
    """Get current wildfire data"""
    try:
        logger.info("Received request for fire data")
        
        # Check if we have valid cached data
        if is_cache_valid(fire_data_cache['timestamp']):
            logger.info("Returning cached fire data")
            return jsonify(fire_data_cache['data'])
        
        # Fetch fresh data
        logger.info("Fetching fresh fire data from external API")
        fire_data = get_fires_data()
        
        # Update cache
        fire_data_cache['data'] = fire_data
        fire_data_cache['timestamp'] = datetime.now().timestamp()
        
        logger.info(f"Successfully fetched {fire_data.get('total', 0)} fires")
        return jsonify(fire_data)
        
    except Exception as e:
        logger.error(f"Error fetching fire data: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch fire data',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/modis', methods=['GET'])
def get_modis():
    """Get MODIS satellite data"""
    try:
        logger.info("Received request for MODIS data")
        
        # Check if we have valid cached data
        if is_satellite_cache_valid('modis'):
            logger.info("Returning cached MODIS data")
            return jsonify(satellite_data_cache['modis']['data'])
        
        # Fetch fresh data
        logger.info("Fetching fresh MODIS data from external API")
        modis_data = get_modis_data()
        
        # Update cache
        satellite_data_cache['modis']['data'] = modis_data
        satellite_data_cache['modis']['timestamp'] = datetime.now().timestamp()
        
        logger.info(f"Successfully fetched {modis_data.get('total', 0)} MODIS hotspots")
        return jsonify(modis_data)
        
    except Exception as e:
        logger.error(f"Error fetching MODIS data: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch MODIS data',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/viirs', methods=['GET'])
def get_viirs():
    """Get VIIRS satellite data"""
    try:
        logger.info("Received request for VIIRS data")
        
        # Check if we have valid cached data
        if is_satellite_cache_valid('viirs'):
            logger.info("Returning cached VIIRS data")
            return jsonify(satellite_data_cache['viirs']['data'])
        
        # Fetch fresh data
        logger.info("Fetching fresh VIIRS data from external API")
        viirs_data = get_viirs_data()
        
        # Update cache
        satellite_data_cache['viirs']['data'] = viirs_data
        satellite_data_cache['viirs']['timestamp'] = datetime.now().timestamp()
        
        logger.info(f"Successfully fetched {viirs_data.get('total', 0)} VIIRS hotspots")
        return jsonify(viirs_data)
        
    except Exception as e:
        logger.error(f"Error fetching VIIRS data: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch VIIRS data',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/fires/<fire_id>', methods=['GET'])
def get_fire_details(fire_id):
    """Get details for a specific fire"""
    try:
        logger.info(f"Received request for fire details: {fire_id}")
        
        # Get current fire data
        if is_cache_valid(fire_data_cache['timestamp']):
            fire_data = fire_data_cache['data']
        else:
            fire_data = get_fires_data()
            fire_data_cache['data'] = fire_data
            fire_data_cache['timestamp'] = datetime.now().timestamp()
        
        # Find the specific fire
        fires = fire_data.get('fires', [])
        fire = next((f for f in fires if str(f.get('id')) == str(fire_id)), None)
        
        if not fire:
            return jsonify({
                'error': 'Fire not found',
                'fire_id': fire_id,
                'timestamp': datetime.now().isoformat()
            }), 404
        
        logger.info(f"Successfully found fire: {fire.get('name', 'Unknown')}")
        return jsonify(fire)
        
    except Exception as e:
        logger.error(f"Error fetching fire details: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch fire details',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/fires/refresh', methods=['POST'])
def refresh_fire_data():
    """Force refresh of fire data cache"""
    try:
        logger.info("Received request to refresh fire data cache")
        
        # Clear cache
        fire_data_cache['data'] = None
        fire_data_cache['timestamp'] = None
        
        # Fetch fresh data
        fire_data = get_fires_data()
        
        # Update cache
        fire_data_cache['data'] = fire_data
        fire_data_cache['timestamp'] = datetime.now().timestamp()
        
        logger.info(f"Successfully refreshed fire data: {fire_data.get('total', 0)} fires")
        return jsonify({
            'message': 'Fire data refreshed successfully',
            'total': fire_data.get('total', 0),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error refreshing fire data: {str(e)}")
        return jsonify({
            'error': 'Failed to refresh fire data',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/satellite/refresh', methods=['POST'])
def refresh_satellite_data():
    """Force refresh of satellite data cache"""
    try:
        logger.info("Received request to refresh satellite data cache")
        
        # Clear caches
        satellite_data_cache['modis']['data'] = None
        satellite_data_cache['modis']['timestamp'] = None
        satellite_data_cache['viirs']['data'] = None
        satellite_data_cache['viirs']['timestamp'] = None
        
        # Fetch fresh data
        modis_data = get_modis_data()
        viirs_data = get_viirs_data()
        
        # Update caches
        satellite_data_cache['modis']['data'] = modis_data
        satellite_data_cache['modis']['timestamp'] = datetime.now().timestamp()
        satellite_data_cache['viirs']['data'] = viirs_data
        satellite_data_cache['viirs']['timestamp'] = datetime.now().timestamp()
        
        logger.info(f"Successfully refreshed satellite data: {modis_data.get('total', 0)} MODIS, {viirs_data.get('total', 0)} VIIRS")
        return jsonify({
            'message': 'Satellite data refreshed successfully',
            'modis_total': modis_data.get('total', 0),
            'viirs_total': viirs_data.get('total', 0),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error refreshing satellite data: {str(e)}")
        return jsonify({
            'error': 'Failed to refresh satellite data',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/prediction/<fire_id>', methods=['GET'])
def get_fire_prediction(fire_id):
    """Get prediction for a specific fire (mock implementation)"""
    try:
        logger.info(f"Received request for fire prediction: {fire_id}")
        
        # Get current fire data to validate fire_id
        if is_cache_valid(fire_data_cache['timestamp']):
            fire_data = fire_data_cache['data']
        else:
            fire_data = get_fires_data()
            fire_data_cache['data'] = fire_data
            fire_data_cache['timestamp'] = datetime.now().timestamp()
        
        # Find the specific fire
        fires = fire_data.get('fires', [])
        fire = next((f for f in fires if str(f.get('id')) == str(fire_id)), None)
        
        if not fire:
            return jsonify({
                'error': 'Fire not found',
                'fire_id': fire_id,
                'timestamp': datetime.now().isoformat()
            }), 404
        
        # Mock prediction data (replace with actual ML model in production)
        import random
        current_size = fire.get('size', 0)
        prediction = {
            'fireId': fire_id,
            'fireName': fire.get('name', 'Unknown'),
            'currentSize': current_size,
            'predictionDate': datetime.now().isoformat(),
            'estimatedSize': current_size * (1.2 + random.random() * 0.8),
            'confidence': random.randint(75, 95),
            'riskLevel': random.choice(['High', 'Critical', 'Medium']),
            'growthRate': random.uniform(0.1, 0.5),
            'factors': {
                'weather': random.choice(['Favorable', 'Unfavorable', 'Critical']),
                'terrain': random.choice(['Flat', 'Hilly', 'Mountainous']),
                'vegetation': random.choice(['Sparse', 'Moderate', 'Dense']),
                'humidity': random.randint(10, 80)
            }
        }
        
        logger.info(f"Successfully generated prediction for fire: {fire.get('name', 'Unknown')}")
        return jsonify(prediction)
        
    except Exception as e:
        logger.error(f"Error generating fire prediction: {str(e)}")
        return jsonify({
            'error': 'Failed to generate fire prediction',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/perimeter-predictions', methods=['GET'])
def get_perimeter_predictions():
    """Serve perimeter predictions GeoJSON"""
    try:
        file_path = os.path.join(os.path.dirname(__file__), 'services', 'perimeter_predictions.json')
        logger.info(f"Loading perimeter predictions from: {file_path}")
        with open(file_path) as f:
            data = json.load(f)
        logger.info(f"Loaded data keys: {list(data.keys())}")
        logger.info(f"Type field: {data.get('type')}")
        logger.info(f"Number of features: {len(data.get('features', []))}")
        
        # Set proper headers
        response = jsonify(data)
        response.headers['Content-Type'] = 'application/json'
        return response
    except Exception as e:
        logger.error(f"Failed to load perimeter predictions: {e}")
        return jsonify({'error': f'Failed to load perimeter predictions: {e}'}), 500



@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Endpoint not found',
        'message': 'The requested resource was not found',
        'timestamp': datetime.now().isoformat()
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred',
        'timestamp': datetime.now().isoformat()
    }), 500

# Production configuration - must be at the end after all routes are defined
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"Starting Flask server on port {port}")
    logger.info(f"Debug mode: {debug}")
    logger.info(f"Environment: {os.environ.get('FLASK_ENV', 'development')}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)