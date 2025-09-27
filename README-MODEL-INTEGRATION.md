# Sign Language Model Integration Guide

This guide explains how to integrate your .pkl model for real-time sign language detection and transcription.

## 🚀 Quick Start

### 1. Set up the Python Backend

1. **Navigate to the API directory:**
   ```bash
   cd api
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Place your .pkl model file:**
   - Copy your `.pkl` model file to the `api/` directory
   - Update the `model_path` variable in `api/model-server.py` (line 95):
     ```python
     model_path = 'path/to/your/model.pkl'  # Update this path
     ```

4. **Start the Flask server:**
   ```bash
   python model-server.py
   ```
   The server will run on `http://localhost:5000`

### 2. Use the AI Model Mode

1. **Start your Next.js application:**
   ```bash
   npm run dev
   ```

2. **Navigate to the AI Model mode:**
   - Click the "AI Model" button in the toolbar
   - This will open the new model-based translation interface

3. **Configure the model:**
   - Adjust confidence threshold (0.1 - 1.0)
   - Set frame skip rate (1-10) for performance
   - Configure max retries for failed requests
   - Update server URL if needed

4. **Start translation:**
   - Click "Start Model Translation" when the server is connected
   - The system will capture video frames and send them to your model
   - Real-time predictions will appear in the interface

## 🔧 Model Integration Details

### Backend Architecture

The integration uses a Flask backend that:
- Loads your .pkl model on startup
- Provides REST API endpoints for predictions
- Handles image preprocessing and postprocessing
- Manages model inference and error handling

### Frontend Architecture

The frontend includes:
- **ModelDetector**: Handles communication with the backend
- **ModelTranslator**: UI component for model-based translation
- **Real-time processing**: Captures video frames and sends to backend
- **Configuration interface**: Adjustable model parameters

### API Endpoints

- `GET /health` - Check server and model status
- `POST /predict` - Send image data for prediction
- `POST /model/load` - Load a new model file

## 🛠️ Customization

### 1. Model Preprocessing

Update the `preprocess_image` function in `api/model-server.py`:

```python
def preprocess_image(image_data, width, height):
    # Your custom preprocessing logic here
    # - Resize to model input size
    # - Normalize pixel values
    # - Apply any required transformations
    pass
```

### 2. Model Postprocessing

Update the `postprocess_prediction` function in `api/model-server.py`:

```python
def postprocess_prediction(prediction):
    # Your custom postprocessing logic here
    # - Extract text and confidence from model output
    # - Map predictions to gesture types
    # - Format response for frontend
    pass
```

### 3. Gesture Mapping

Update the gesture mapping in `api/model-server.py`:

```python
gesture_mapping = {
    'your_model_output': 'gesture_type',
    # Add more mappings as needed
}
```

### 4. Frontend Configuration

Modify `lib/model-detector.ts` for:
- Different server URLs
- Custom retry logic
- Additional model parameters

## 📊 Performance Optimization

### Backend Optimization
- **Frame skipping**: Process every Nth frame instead of all frames
- **Image compression**: Reduce image quality for faster transmission
- **Model caching**: Keep model in memory for faster inference
- **Batch processing**: Process multiple frames at once

### Frontend Optimization
- **Canvas optimization**: Use appropriate canvas size
- **Request throttling**: Limit prediction requests per second
- **Error handling**: Implement exponential backoff for retries
- **Memory management**: Clean up resources when stopping

## 🔍 Troubleshooting

### Common Issues

1. **Server not connecting:**
   - Check if Flask server is running on port 5000
   - Verify CORS is enabled
   - Check browser console for errors

2. **Model not loading:**
   - Verify .pkl file path is correct
   - Check model file permissions
   - Ensure all dependencies are installed

3. **Poor predictions:**
   - Adjust confidence threshold
   - Check image preprocessing
   - Verify model input format
   - Test with different lighting conditions

4. **Performance issues:**
   - Increase frame skip rate
   - Reduce image resolution
   - Check server CPU/memory usage
   - Optimize model inference

### Debug Mode

Enable debug logging in `api/model-server.py`:

```python
app.run(host='0.0.0.0', port=5000, debug=True)
```

Check browser console and server logs for detailed error information.

## 🎯 Next Steps

1. **Test with your model**: Replace the mock predictions with your actual model
2. **Optimize performance**: Adjust parameters based on your hardware
3. **Add more features**: Implement additional model outputs or UI enhancements
4. **Deploy**: Consider deploying the backend to a cloud service for production use

## 📝 Notes

- The current implementation includes mock predictions for testing
- Replace the mock logic with your actual model inference
- Adjust the model input/output format based on your specific model
- Consider adding authentication for production deployments
- Monitor server performance and implement proper logging
