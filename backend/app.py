from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys
from datetime import datetime
import logging

# Add the services directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'services'))

# Import the fire service
try:
    from fire_service import get_fires_data
except ImportError as e:
    print(f"Error importing fire_service: {e}")
    sys.exit(1)

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for all routes (adjust origins for production)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Cache for fire data to avoid too many API calls
fire_data_cache = {
    'data': None,
    'timestamp': None,
    'cache_duration': 300  # 5 minutes in seconds
}

def is_cache_valid():
    """Check if the cached data is still valid"""
    if not fire_data_cache['data'] or not fire_data_cache['timestamp']:
        return False
    
    current_time = datetime.now().timestamp()
    cache_time = fire_data_cache['timestamp']
    
    return (current_time - cache_time) < fire_data_cache['cache_duration']

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
        'cache_status': 'valid' if is_cache_valid() else 'expired'
    })

@app.route('/api/fires', methods=['GET'])
def get_fires():
    """Get current wildfire data"""
    try:
        logger.info("Received request for fire data")
        
        # Check if we have valid cached data
        if is_cache_valid():
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

@app.route('/api/fires/<fire_id>', methods=['GET'])
def get_fire_details(fire_id):
    """Get details for a specific fire"""
    try:
        logger.info(f"Received request for fire details: {fire_id}")
        
        # Get current fire data
        if is_cache_valid():
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

@app.route('/api/prediction/<fire_id>', methods=['GET'])
def get_fire_prediction(fire_id):
    """Get prediction for a specific fire (mock implementation)"""
    try:
        logger.info(f"Received request for fire prediction: {fire_id}")
        
        # Get current fire data to validate fire_id
        if is_cache_valid():
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

if __name__ == '__main__':
    # Get configuration from environment variables
    host = os.getenv('FLASK_HOST', '127.0.0.1')
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    logger.info(f"Starting Flask server on {host}:{port}")
    logger.info(f"Debug mode: {debug}")
    
    app.run(
        host=host,
        port=port,
        debug=debug,
        threaded=True
    )