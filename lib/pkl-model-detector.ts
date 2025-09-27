import { type Gesture } from './mediapipe-detector'

export interface PKLPrediction {
  letter: string
  confidence: number
  gesture: Gesture
  isCorrect: boolean
}

export interface PKLModelData {
  filename: string
  true_class: number
  pred_class: number
  pred_label: string
  true_label: string
}

export class PKLModelDetector {
  private video: HTMLVideoElement
  private onPrediction: (prediction: PKLPrediction) => void
  private isDetecting = false
  private frameCount = 0
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private modelData: PKLModelData[] = []
  private currentIndex = 0
  private confidenceThreshold = 0.7
  private frameSkip = 10 // Process every 10th frame

  // ASL letter to gesture mapping
  private letterToGesture: Record<string, Gesture> = {
    'a': 'hello', 'b': 'thanks', 'c': 'help', 'd': 'wait', 'e': 'repeat',
    'f': 'yes', 'g': 'no', 'h': 'hello', 'i': 'thanks', 'j': 'help',
    'k': 'wait', 'l': 'repeat', 'm': 'yes', 'n': 'no', 'o': 'hello',
    'p': 'thanks', 'q': 'help', 'r': 'wait', 's': 'repeat', 't': 'yes',
    'u': 'no', 'v': 'hello', 'w': 'thanks', 'x': 'help', 'y': 'wait',
    'z': 'repeat', '0': 'idle', '1': 'hello', '2': 'thanks', '3': 'help',
    '4': 'wait', '5': 'repeat', '6': 'yes', '7': 'no', '8': 'hello', '9': 'thanks'
  }

  constructor(
    video: HTMLVideoElement,
    onPrediction: (prediction: PKLPrediction) => void,
    modelData: PKLModelData[]
  ) {
    this.video = video
    this.onPrediction = onPrediction
    this.modelData = modelData

    // Create canvas for frame extraction
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
    this.canvas.width = 224 // Common model input size
    this.canvas.height = 224
  }

  async startDetection() {
    if (this.isDetecting) return

    this.isDetecting = true
    this.frameCount = 0
    this.currentIndex = 0

    const processFrame = () => {
      if (!this.isDetecting) return

      this.frameCount++
      
      // Skip frames for performance
      if (this.frameCount % this.frameSkip === 0) {
        this.simulatePrediction()
      }

      requestAnimationFrame(processFrame)
    }

    processFrame()
  }

  private simulatePrediction() {
    // Simulate model prediction using the loaded data
    if (this.modelData.length === 0) return

    // Cycle through the predictions
    const prediction = this.modelData[this.currentIndex % this.modelData.length]
    this.currentIndex++

    // Calculate confidence based on prediction accuracy
    const isCorrect = prediction.pred_label === prediction.true_label
    const confidence = isCorrect ? 0.8 + Math.random() * 0.2 : 0.3 + Math.random() * 0.4

    // Only process if confidence is above threshold
    if (confidence >= this.confidenceThreshold) {
      const letter = prediction.pred_label
      const gesture = this.letterToGesture[letter] || 'idle'

      const pklPrediction: PKLPrediction = {
        letter,
        confidence,
        gesture,
        isCorrect
      }

      this.onPrediction(pklPrediction)
    }
  }

  stopDetection() {
    this.isDetecting = false
  }

  // Method to update configuration
  updateConfig(config: { confidenceThreshold?: number; frameSkip?: number }) {
    if (config.confidenceThreshold !== undefined) {
      this.confidenceThreshold = config.confidenceThreshold
    }
    if (config.frameSkip !== undefined) {
      this.frameSkip = config.frameSkip
    }
  }

  // Method to get current status
  getStatus() {
    return {
      isDetecting: this.isDetecting,
      frameCount: this.frameCount,
      currentIndex: this.currentIndex,
      totalPredictions: this.modelData.length,
      confidenceThreshold: this.confidenceThreshold,
      frameSkip: this.frameSkip
    }
  }

  // Method to get prediction statistics
  getPredictionStats() {
    const total = this.modelData.length
    const correct = this.modelData.filter(p => p.pred_label === p.true_label).length
    const accuracy = total > 0 ? (correct / total) * 100 : 0

    return {
      total,
      correct,
      accuracy: Math.round(accuracy * 100) / 100,
      uniqueLetters: [...new Set(this.modelData.map(p => p.pred_label))].length
    }
  }
}
