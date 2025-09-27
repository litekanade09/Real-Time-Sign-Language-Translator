import { type Gesture } from './mediapipe-detector'

export interface ModelPrediction {
  text: string
  confidence: number
  gesture: Gesture
  landmarks?: number[][]
}

export interface ModelConfig {
  serverUrl: string
  confidenceThreshold: number
  frameSkip: number
  maxRetries: number
}

export class ModelDetector {
  private video: HTMLVideoElement
  private onPrediction: (prediction: ModelPrediction) => void
  private isDetecting = false
  private frameCount = 0
  private config: ModelConfig
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private retryCount = 0

  constructor(
    video: HTMLVideoElement,
    onPrediction: (prediction: ModelPrediction) => void,
    config: ModelConfig
  ) {
    this.video = video
    this.onPrediction = onPrediction
    this.config = {
      serverUrl: 'http://localhost:5000',
      confidenceThreshold: 0.7,
      frameSkip: 5,
      maxRetries: 3,
      ...config
    }

    // Create canvas for frame extraction
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
    this.canvas.width = 640
    this.canvas.height = 480
  }

  async startDetection() {
    if (this.isDetecting) return

    // Check if server is available
    const isServerAvailable = await this.checkServerHealth()
    if (!isServerAvailable) {
      console.error('Model server is not available')
      return
    }

    this.isDetecting = true
    this.frameCount = 0
    this.retryCount = 0

    const processFrame = () => {
      if (!this.isDetecting) return

      this.frameCount++
      
      // Skip frames for performance
      if (this.frameCount % this.config.frameSkip === 0) {
        this.captureAndProcessFrame()
      }

      requestAnimationFrame(processFrame)
    }

    processFrame()
  }

  private async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.serverUrl}/health`)
      const data = await response.json()
      return data.status === 'healthy' && data.model_loaded
    } catch (error) {
      console.error('Server health check failed:', error)
      return false
    }
  }

  private async captureAndProcessFrame() {
    if (!this.video || this.video.readyState !== 4) return

    try {
      // Draw video frame to canvas
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height)
      
      // Convert canvas to base64
      const imageData = this.canvas.toDataURL('image/jpeg', 0.8)
      const base64Data = imageData.split(',')[1] // Remove data:image/jpeg;base64, prefix
      
      // Send to server for prediction
      await this.sendPredictionRequest(base64Data)
      
    } catch (error) {
      console.error('Error capturing frame:', error)
    }
  }

  private async sendPredictionRequest(imageData: string) {
    try {
      const response = await fetch(`${this.config.serverUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_data: imageData,
          width: this.canvas.width,
          height: this.canvas.height
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const prediction: ModelPrediction = await response.json()
      
      // Reset retry count on successful prediction
      this.retryCount = 0
      
      // Only process predictions above confidence threshold
      if (prediction.confidence >= this.config.confidenceThreshold) {
        this.onPrediction(prediction)
      }

    } catch (error) {
      console.error('Prediction request failed:', error)
      
      // Retry logic
      this.retryCount++
      if (this.retryCount < this.config.maxRetries) {
        console.log(`Retrying prediction request (${this.retryCount}/${this.config.maxRetries})`)
        setTimeout(() => {
          this.captureAndProcessFrame()
        }, 1000 * this.retryCount) // Exponential backoff
      } else {
        console.error('Max retries reached for prediction request')
        this.retryCount = 0
      }
    }
  }

  stopDetection() {
    this.isDetecting = false
    this.retryCount = 0
  }

  // Method to update configuration
  updateConfig(newConfig: Partial<ModelConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  // Method to get current status
  getStatus() {
    return {
      isDetecting: this.isDetecting,
      frameCount: this.frameCount,
      retryCount: this.retryCount,
      config: this.config
    }
  }

  // Method to test server connection
  async testConnection(): Promise<boolean> {
    return await this.checkServerHealth()
  }
}
