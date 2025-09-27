"""
Python Flask server for serving the .pkl model
This server handles the actual model inference
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import cv2
import base64
from io import BytesIO
from PIL import Image
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Global variables for model
model = None
model_loaded = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_model(model_path):
    """Load the .pkl model file"""
    global model, model_loaded
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        model_loaded = True
        logger.info(f"Model loaded successfully from {model_path}")
        return True
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return False

def preprocess_image(image_data, width, height):
    """
    Preprocess the image data for model input
    Adjust this based on your model's requirements
    """
    try:
        # Convert base64 to image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize to model input size (adjust as needed)
        image = image.resize((224, 224))  # Common input size, adjust for your model
        
        # Convert to numpy array
        image_array = np.array(image)
        
        # Normalize pixel values (adjust based on your model's requirements)
        image_array = image_array.astype(np.float32) / 255.0
        
        # Add batch dimension
        image_array = np.expand_dims(image_array, axis=0)
        
        return image_array
    except Exception as e:
        logger.error(f"Error preprocessing image: {e}")
        return None

def postprocess_prediction(prediction):
    """
    Postprocess model prediction to extract text and confidence
    Adjust this based on your model's output format
    """
    try:
        # This is a placeholder - adjust based on your model's actual output
        if isinstance(prediction, tuple) and len(prediction) >= 2:
            # If model returns (text, confidence)
            text, confidence = prediction[0], prediction[1]
        elif isinstance(prediction, dict):
            # If model returns dictionary
            text = prediction.get('text', '')
            confidence = prediction.get('confidence', 0.0)
        else:
            # Fallback - adjust based on your model's output
            text = str(prediction) if prediction is not None else ''
            confidence = 0.8  # Default confidence
        
        # Map to gesture types (adjust based on your model's output)
        gesture_mapping = {
            'hello': 'hello',
            'hi': 'hello',
            'thanks': 'thanks',
            'thank you': 'thanks',
            'help': 'help',
            'wait': 'wait',
            'yes': 'yes',
            'no': 'no',
            'repeat': 'repeat',
            '': 'idle'
        }
        
        gesture = gesture_mapping.get(text.lower(), 'idle')
        
        return {
            'text': text,
            'confidence': float(confidence),
            'gesture': gesture,
            'landmarks': []  # Add if your model provides landmarks
        }
    except Exception as e:
        logger.error(f"Error postprocessing prediction: {e}")
        return {
            'text': '',
            'confidence': 0.0,
            'gesture': 'idle',
            'landmarks': []
        }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model_loaded
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint"""
    try:
        if not model_loaded:
            return jsonify({'error': 'Model not loaded'}), 500
        
        data = request.get_json()
        image_data = data.get('image_data')
        width = data.get('width', 640)
        height = data.get('height', 480)
        
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Preprocess image
        processed_image = preprocess_image(image_data, width, height)
        if processed_image is None:
            return jsonify({'error': 'Failed to preprocess image'}), 400
        
        # Run model prediction
        # Adjust this based on your model's prediction method
        prediction = model.predict(processed_image)
        
        # Postprocess prediction
        result = postprocess_prediction(prediction)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/model/load', methods=['POST'])
def load_model_endpoint():
    """Endpoint to load model"""
    try:
        data = request.get_json()
        model_path = data.get('model_path')
        
        if not model_path:
            return jsonify({'error': 'No model path provided'}), 400
        
        success = load_model(model_path)
        
        if success:
            return jsonify({'message': 'Model loaded successfully'})
        else:
            return jsonify({'error': 'Failed to load model'}), 500
            
    except Exception as e:
        logger.error(f"Model loading error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Load model on startup (adjust path as needed)
    model_path = 'path/to/your/model.pkl'  # Update this path
    load_model(model_path)
    
    # Run server
    app.run(host='0.0.0.0', port=5000, debug=True)
