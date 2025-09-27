import { Hands } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'

export type Gesture = "idle" | "hello" | "thanks" | "help" | "wait" | "repeat" | "yes" | "no"

export interface HandLandmark {
  x: number
  y: number
  z: number
}

export interface HandDetection {
  landmarks: HandLandmark[]
  handedness: 'Left' | 'Right'
  confidence: number
}

export class MediaPipeGestureDetector {
  private hands: Hands
  private camera: Camera | null = null
  private video: HTMLVideoElement
  private onGestureDetected: (gesture: Gesture) => void
  private isDetecting = false
  private lastGesture: Gesture = "idle"
  private gestureHistory: Gesture[] = []
  private confidenceThreshold = 0.7

  constructor(
    video: HTMLVideoElement,
    onGestureDetected: (gesture: Gesture) => void
  ) {
    this.video = video
    this.onGestureDetected = onGestureDetected
    
    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      }
    })

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    })

    this.hands.onResults((results) => {
      this.processHandResults(results)
    })
  }

  async startDetection() {
    if (this.isDetecting) return

    try {
      this.camera = new Camera(this.video, {
        onFrame: async () => {
          if (this.hands && this.video) {
            await this.hands.send({ image: this.video })
          }
        },
        width: 640,
        height: 480
      })

      await this.camera.start()
      this.isDetecting = true
    } catch (error) {
      console.error('Failed to start MediaPipe detection:', error)
    }
  }

  stopDetection() {
    if (this.camera) {
      this.camera.stop()
      this.camera = null
    }
    this.isDetecting = false
  }

  private processHandResults(results: any) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      // Only change to idle if we've been idle for a while
      if (this.lastGesture !== "idle") {
        this.gestureHistory.push("idle")
        if (this.gestureHistory.length > 5) {
          this.gestureHistory.shift()
        }
        
        if (this.isGestureConsistent("idle")) {
          this.lastGesture = "idle"
          this.onGestureDetected("idle")
        }
      }
      return
    }

    const hands: HandDetection[] = results.multiHandLandmarks.map((landmarks: any[], index: number) => ({
      landmarks: landmarks.map((landmark: any) => ({
        x: landmark.x,
        y: landmark.y,
        z: landmark.z
      })),
      handedness: results.multiHandedness[index].label as 'Left' | 'Right',
      confidence: results.multiHandedness[index].score
    }))

    // Filter out low confidence detections
    const highConfidenceHands = hands.filter(hand => hand.confidence > 0.6)
    if (highConfidenceHands.length === 0) return

    const gesture = this.classifyGesture(highConfidenceHands)
    
    // Always add to history for consistency checking
    this.gestureHistory.push(gesture)
    if (this.gestureHistory.length > 5) {
      this.gestureHistory.shift()
    }
    
    // Only trigger if gesture is consistent and different from last
    if (this.isGestureConsistent(gesture) && gesture !== this.lastGesture) {
      this.lastGesture = gesture
      this.onGestureDetected(gesture)
    }
  }

  private classifyGesture(hands: HandDetection[]): Gesture {
    if (hands.length === 0) return "idle"

    const hand = hands[0] // Use first hand for now
    const landmarks = hand.landmarks

    // Get key landmark positions
    const thumbTip = landmarks[4]
    const thumbIp = landmarks[3]
    const thumbMcp = landmarks[2]
    const indexTip = landmarks[8]
    const indexPip = landmarks[6]
    const indexMcp = landmarks[5]
    const middleTip = landmarks[12]
    const middlePip = landmarks[10]
    const middleMcp = landmarks[9]
    const ringTip = landmarks[16]
    const ringPip = landmarks[14]
    const ringMcp = landmarks[13]
    const pinkyTip = landmarks[20]
    const pinkyPip = landmarks[18]
    const pinkyMcp = landmarks[17]
    const wrist = landmarks[0]

    // Calculate distances and angles with more precision
    const thumbIndexDistance = this.calculateDistance(thumbTip, indexTip)
    const indexMiddleDistance = this.calculateDistance(indexTip, middleTip)
    const middleRingDistance = this.calculateDistance(middleTip, ringTip)
    const ringPinkyDistance = this.calculateDistance(ringTip, pinkyTip)
    
    // Calculate finger extension (more accurate)
    const thumbExtended = this.isFingerExtended(thumbTip, thumbIp, thumbMcp, wrist)
    const indexExtended = this.isFingerExtended(indexTip, indexPip, indexMcp, wrist)
    const middleExtended = this.isFingerExtended(middleTip, middlePip, middleMcp, wrist)
    const ringExtended = this.isFingerExtended(ringTip, ringPip, ringMcp, wrist)
    const pinkyExtended = this.isFingerExtended(pinkyTip, pinkyPip, pinkyMcp, wrist)

    // Calculate hand position relative to wrist
    const handHeight = wrist.y - Math.min(thumbTip.y, indexTip.y, middleTip.y, ringTip.y, pinkyTip.y)
    const handWidth = Math.max(thumbTip.x, indexTip.x, middleTip.x, ringTip.x, pinkyTip.x) - 
                     Math.min(thumbTip.x, indexTip.x, middleTip.x, ringTip.x, pinkyTip.x)

    // More precise gesture classification
    const extendedFingers = [thumbExtended, indexExtended, middleExtended, ringExtended, pinkyExtended]
    const extendedCount = extendedFingers.filter(Boolean).length

    // Hello gesture: All fingers extended, hand raised
    if (extendedCount >= 4 && handHeight > 0.2) {
      return "hello"
    }

    // Thanks gesture: Thumb and index extended, others closed
    if (thumbExtended && indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      return "thanks"
    }

    // Help gesture: Index and middle extended, others closed
    if (!thumbExtended && indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      return "help"
    }

    // Wait gesture: Fist (no fingers extended)
    if (extendedCount === 0 && handHeight < 0.15) {
      return "wait"
    }

    // Yes gesture: Thumb up (only thumb extended)
    if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      return "yes"
    }

    // No gesture: Index finger extended, others closed
    if (!thumbExtended && indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      return "no"
    }

    // Repeat gesture: All fingers extended, hand not raised
    if (extendedCount >= 4 && handHeight <= 0.2) {
      return "repeat"
    }

    return "idle"
  }

  private isFingerExtended(tip: HandLandmark, pip: HandLandmark, mcp: HandLandmark, wrist: HandLandmark): boolean {
    // Calculate finger extension based on angle between joints
    const tipToPip = this.calculateDistance(tip, pip)
    const pipToMcp = this.calculateDistance(pip, mcp)
    const mcpToWrist = this.calculateDistance(mcp, wrist)
    
    // Finger is extended if the tip is significantly further from the wrist than the MCP
    const tipToWrist = this.calculateDistance(tip, wrist)
    const mcpToWristDistance = this.calculateDistance(mcp, wrist)
    
    return tipToWrist > mcpToWristDistance * 1.2
  }

  private calculateDistance(point1: HandLandmark, point2: HandLandmark): number {
    const dx = point1.x - point2.x
    const dy = point1.y - point2.y
    const dz = point1.z - point2.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  private isGestureConsistent(gesture: Gesture): boolean {
    if (this.gestureHistory.length < 5) return true
    
    const recentGestures = this.gestureHistory.slice(-5)
    const gestureCount = recentGestures.filter(g => g === gesture).length
    
    // Require gesture to appear in 3 out of last 5 detections for better stability
    return gestureCount >= 3
  }

  // Real-time gesture confidence scoring
  getGestureConfidence(gesture: Gesture): number {
    if (this.gestureHistory.length === 0) return 0
    
    const recentGestures = this.gestureHistory.slice(-5)
    const gestureCount = recentGestures.filter(g => g === gesture).length
    
    return gestureCount / recentGestures.length
  }

  // Get current hand landmarks for advanced analysis
  getCurrentLandmarks(): HandLandmark[] | null {
    // This would be populated by the latest detection results
    // For now, return null as we don't store the latest landmarks
    return null
  }
}

// Real-time emotion detection from text
export const detectEmotionFromText = (text: string): string => {
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

// Real-time gesture detection from text
export const detectGestureFromText = (text: string): Gesture => {
  const lowerText = text.toLowerCase()
  
  // Check for exact keyword matches
  const keywordMap: Record<string, Gesture> = {
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

  for (const [keyword, gesture] of Object.entries(keywordMap)) {
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
