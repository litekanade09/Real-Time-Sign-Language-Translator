// Gesture detection and mapping utilities
export type Gesture = "idle" | "hello" | "thanks" | "help" | "wait" | "repeat" | "yes" | "no"
export type Emotion = "neutral" | "happy" | "sad" | "angry" | "surprised" | "confused"

// Keyword to gesture mapping
export const keywordToGesture: Record<string, Gesture> = {
  "hello": "hello",
  "hi": "hello",
  "hey": "hello",
  "thanks": "thanks",
  "thank": "thanks",
  "help": "help",
  "wait": "wait",
  "repeat": "repeat",
  "yes": "yes",
  "no": "no",
  "please": "help",
  "urgent": "help"
}

// Emotion detection from text
export const detectEmotion = (text: string): Emotion => {
  const lowerText = text.toLowerCase()
  
  // Happy indicators
  if (lowerText.includes("happy") || lowerText.includes("great") || 
      lowerText.includes("good") || lowerText.includes("wonderful") ||
      lowerText.includes("excellent") || lowerText.includes("amazing")) {
    return "happy"
  }
  
  // Sad indicators
  if (lowerText.includes("sad") || lowerText.includes("sorry") || 
      lowerText.includes("unfortunately") || lowerText.includes("bad") ||
      lowerText.includes("terrible") || lowerText.includes("awful")) {
    return "sad"
  }
  
  // Angry indicators
  if (lowerText.includes("angry") || lowerText.includes("mad") || 
      lowerText.includes("furious") || lowerText.includes("upset") ||
      lowerText.includes("annoyed") || lowerText.includes("frustrated")) {
    return "angry"
  }
  
  // Surprised indicators
  if (lowerText.includes("wow") || lowerText.includes("surprised") || 
      lowerText.includes("amazing") || lowerText.includes("incredible") ||
      lowerText.includes("unbelievable") || lowerText.includes("shocked")) {
    return "surprised"
  }
  
  // Confused indicators
  if (lowerText.includes("confused") || lowerText.includes("unclear") || 
      lowerText.includes("don't understand") || lowerText.includes("puzzled") ||
      lowerText.includes("lost") || lowerText.includes("unclear")) {
    return "confused"
  }
  
  return "neutral"
}

// Gesture detection from text
export const detectGesture = (text: string): Gesture => {
  const lowerText = text.toLowerCase()
  
  // Check for exact keyword matches first
  for (const [keyword, gesture] of Object.entries(keywordToGesture)) {
    if (lowerText.includes(keyword)) {
      return gesture
    }
  }
  
  // Check for phrase patterns
  if (lowerText.includes("can you repeat") || lowerText.includes("say again")) {
    return "repeat"
  }
  
  if (lowerText.includes("wait a moment") || lowerText.includes("hold on")) {
    return "wait"
  }
  
  if (lowerText.includes("i need help") || lowerText.includes("assistance")) {
    return "help"
  }
  
  return "idle"
}

// Real-time gesture detection from video stream
export class GestureDetector {
  private video: HTMLVideoElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private isDetecting = false
  private detectionInterval: number | null = null
  private onGestureDetected: (gesture: Gesture) => void

  constructor(
    video: HTMLVideoElement, 
    onGestureDetected: (gesture: Gesture) => void
  ) {
    this.video = video
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
    this.onGestureDetected = onGestureDetected
  }

  startDetection() {
    if (this.isDetecting) return
    
    this.isDetecting = true
    this.detectionInterval = window.setInterval(() => {
      this.detectGesture()
    }, 100) // Check every 100ms
  }

  stopDetection() {
    this.isDetecting = false
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval)
      this.detectionInterval = null
    }
  }

  private detectGesture() {
    if (!this.video.videoWidth || !this.video.videoHeight) return

    // Set canvas size to match video
    this.canvas.width = this.video.videoWidth
    this.canvas.height = this.video.videoHeight

    // Draw current video frame to canvas
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height)

    // Get image data for analysis
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    
    // Simple gesture detection based on hand position and movement
    const gesture = this.analyzeHandPosition(imageData)
    
    if (gesture !== "idle") {
      this.onGestureDetected(gesture)
    }
  }

  private analyzeHandPosition(imageData: ImageData): Gesture {
    // This is a simplified gesture detection
    // In a real implementation, you would use MediaPipe, TensorFlow.js, or similar
    
    const { data, width, height } = imageData
    let handPixels = 0
    let centerX = 0
    let centerY = 0

    // Simple skin color detection (very basic)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // Basic skin color detection
      if (r > 95 && g > 40 && b > 20 && 
          r > g && r > b && 
          Math.abs(r - g) > 15) {
        handPixels++
        const pixelIndex = i / 4
        centerX += pixelIndex % width
        centerY += Math.floor(pixelIndex / width)
      }
    }

    if (handPixels < 100) return "idle"

    centerX = centerX / handPixels
    centerY = centerY / handPixels

    // Determine gesture based on hand position
    const centerScreenX = width / 2
    const centerScreenY = height / 2

    // Simple gesture classification based on hand position
    if (centerY < centerScreenY * 0.3) {
      return "hello"
    } else if (centerY > centerScreenY * 0.7) {
      return "help"
    } else if (Math.abs(centerX - centerScreenX) > centerScreenX * 0.3) {
      return "thanks"
    }

    return "idle"
  }
}

// Gesture animation sequences
export const gestureAnimations = {
  hello: {
    duration: 2000,
    frames: [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0],
    emotion: "happy" as Emotion
  },
  thanks: {
    duration: 1500,
    frames: [0, 1, 2, 3, 2, 1, 0],
    emotion: "happy" as Emotion
  },
  help: {
    duration: 2500,
    frames: [0, 1, 2, 3, 4, 3, 2, 1, 0],
    emotion: "neutral" as Emotion
  },
  wait: {
    duration: 3000,
    frames: [0, 1, 0, 1, 0],
    emotion: "neutral" as Emotion
  },
  repeat: {
    duration: 2000,
    frames: [0, 1, 2, 1, 0, 1, 2, 1, 0],
    emotion: "confused" as Emotion
  },
  yes: {
    duration: 1000,
    frames: [0, 1, 0],
    emotion: "happy" as Emotion
  },
  no: {
    duration: 1000,
    frames: [0, 1, 0],
    emotion: "neutral" as Emotion
  },
  idle: {
    duration: 4000,
    frames: [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0],
    emotion: "neutral" as Emotion
  }
}
