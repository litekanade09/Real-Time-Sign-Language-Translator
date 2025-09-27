import { Hands } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'

export type Gesture = "idle" | "hello" | "thanks" | "help" | "wait" | "repeat" | "yes" | "no" | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z" | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

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

export interface GesturePrediction {
  gesture: Gesture
  confidence: number
  text: string
  isStable: boolean
}

export class RealTimeGestureDetector {
  private hands: Hands
  private camera: Camera | null = null
  private video: HTMLVideoElement
  private onGestureDetected: (prediction: GesturePrediction) => void
  private isDetecting = false
  private gestureHistory: Gesture[] = []
  private lastStableGesture: Gesture = "idle"
  private stabilityThreshold = 3 // Require 3 consistent detections
  private confidenceThreshold = 0.7
  private lastGestureTime = 0
  private gestureCooldown = 1000 // 1 second cooldown between gestures

  // ASL letter to text mapping
  private gestureToText: Record<Gesture, string> = {
    "idle": "",
    "hello": "Hello",
    "thanks": "Thank you",
    "help": "Help",
    "wait": "Wait",
    "repeat": "Repeat",
    "yes": "Yes",
    "no": "No",
    "a": "A", "b": "B", "c": "C", "d": "D", "e": "E", "f": "F", "g": "G", "h": "H",
    "i": "I", "j": "J", "k": "K", "l": "L", "m": "M", "n": "N", "o": "O", "p": "P",
    "q": "Q", "r": "R", "s": "S", "t": "T", "u": "U", "v": "V", "w": "W", "x": "X",
    "y": "Y", "z": "Z", "0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5",
    "6": "6", "7": "7", "8": "8", "9": "9"
  }

  constructor(
    video: HTMLVideoElement,
    onGestureDetected: (prediction: GesturePrediction) => void
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
      // No hands detected, reset to idle
      this.resetToIdle()
      return
    }

    // Process each detected hand
    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
      const landmarks = results.multiHandLandmarks[i]
      const handedness = results.multiHandedness[i]
      
      if (handedness.score < this.confidenceThreshold) continue

      const gesture = this.classifyGesture(landmarks, handedness.label)
      this.updateGestureHistory(gesture)
    }
  }

  private classifyGesture(landmarks: any[], handedness: string): Gesture {
    // Convert landmarks to our format
    const handLandmarks: HandLandmark[] = landmarks.map((landmark: any) => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z
    }))

    // Check for ASL letters first
    const aslLetter = this.detectASLLetter(handLandmarks)
    if (aslLetter !== "idle") {
      return aslLetter
    }

    // Check for common gestures
    return this.detectCommonGestures(handLandmarks)
  }

  private detectASLLetter(landmarks: HandLandmark[]): Gesture {
    // Thumb tip (4), Index tip (8), Middle tip (12), Ring tip (16), Pinky tip (20)
    const thumbTip = landmarks[4]
    const indexTip = landmarks[8]
    const middleTip = landmarks[12]
    const ringTip = landmarks[16]
    const pinkyTip = landmarks[20]

    // Thumb base (1), Index base (5), Middle base (9), Ring base (13), Pinky base (17)
    const thumbBase = landmarks[1]
    const indexBase = landmarks[5]
    const middleBase = landmarks[9]
    const ringBase = landmarks[13]
    const pinkyBase = landmarks[17]

    // Check finger extensions
    const thumbExtended = this.isFingerExtended(thumbTip, thumbBase, landmarks[2])
    const indexExtended = this.isFingerExtended(indexTip, indexBase, landmarks[6])
    const middleExtended = this.isFingerExtended(middleTip, middleBase, landmarks[10])
    const ringExtended = this.isFingerExtended(ringTip, ringBase, landmarks[14])
    const pinkyExtended = this.isFingerExtended(pinkyTip, pinkyBase, landmarks[18])

    // ASL Letter Detection
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended && !thumbExtended) {
      return "1"
    }
    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended && !thumbExtended) {
      return "2"
    }
    if (indexExtended && middleExtended && ringExtended && !pinkyExtended && !thumbExtended) {
      return "3"
    }
    if (indexExtended && middleExtended && ringExtended && pinkyExtended && !thumbExtended) {
      return "4"
    }
    if (indexExtended && middleExtended && ringExtended && pinkyExtended && thumbExtended) {
      return "5"
    }
    if (indexExtended && middleExtended && ringExtended && pinkyExtended && !thumbExtended) {
      return "6"
    }
    if (indexExtended && middleExtended && ringExtended && pinkyExtended && thumbExtended) {
      return "7"
    }
    if (indexExtended && middleExtended && ringExtended && pinkyExtended && thumbExtended) {
      return "8"
    }
    if (indexExtended && middleExtended && ringExtended && pinkyExtended && thumbExtended) {
      return "9"
    }
    if (indexExtended && middleExtended && ringExtended && pinkyExtended && thumbExtended) {
      return "0"
    }

    // Letter A - Fist with thumb extended
    if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended && thumbExtended) {
      return "a"
    }

    // Letter B - All fingers extended except thumb
    if (indexExtended && middleExtended && ringExtended && pinkyExtended && !thumbExtended) {
      return "b"
    }

    // Letter C - Curved fingers
    if (this.isCurvedGesture(landmarks)) {
      return "c"
    }

    // Letter D - Index and middle extended
    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended && !thumbExtended) {
      return "d"
    }

    // Letter E - All fingers bent
    if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended && !thumbExtended) {
      return "e"
    }

    // Letter F - Thumb and index touching
    if (this.isThumbIndexTouching(thumbTip, indexTip)) {
      return "f"
    }

    // Letter G - Index pointing
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended && !thumbExtended) {
      return "g"
    }

    // Letter H - Index and middle extended, close together
    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended && !thumbExtended) {
      return "h"
    }

    // Letter I - Pinky extended
    if (!indexExtended && !middleExtended && !ringExtended && pinkyExtended && !thumbExtended) {
      return "i"
    }

    // Letter J - Pinky extended with movement
    if (!indexExtended && !middleExtended && !ringExtended && pinkyExtended && !thumbExtended) {
      return "j"
    }

    // Letter K - Index and middle extended, apart
    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended && !thumbExtended) {
      return "k"
    }

    // Letter L - Index and thumb extended
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended && thumbExtended) {
      return "l"
    }

    // Letter M - Thumb between index and middle
    if (this.isThumbBetweenFingers(landmarks)) {
      return "m"
    }

    // Letter N - Thumb between index and middle, different position
    if (this.isThumbBetweenFingers(landmarks)) {
      return "n"
    }

    // Letter O - Thumb and index forming circle
    if (this.isThumbIndexCircle(thumbTip, indexTip)) {
      return "o"
    }

    // Letter P - Index pointing down
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended && !thumbExtended) {
      return "p"
    }

    // Letter Q - Thumb and pinky extended
    if (!indexExtended && !middleExtended && !ringExtended && pinkyExtended && thumbExtended) {
      return "q"
    }

    // Letter R - Index and middle crossed
    if (this.isIndexMiddleCrossed(landmarks)) {
      return "r"
    }

    // Letter S - Fist
    if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended && !thumbExtended) {
      return "s"
    }

    // Letter T - Thumb between index and middle
    if (this.isThumbBetweenFingers(landmarks)) {
      return "t"
    }

    // Letter U - Index and middle extended, close
    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended && !thumbExtended) {
      return "u"
    }

    // Letter V - Index and middle extended, apart
    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended && !thumbExtended) {
      return "v"
    }

    // Letter W - Index, middle, ring extended
    if (indexExtended && middleExtended && ringExtended && !pinkyExtended && !thumbExtended) {
      return "w"
    }

    // Letter X - Index bent
    if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended && !thumbExtended) {
      return "x"
    }

    // Letter Y - Thumb and pinky extended
    if (!indexExtended && !middleExtended && !ringExtended && pinkyExtended && thumbExtended) {
      return "y"
    }

    // Letter Z - Index and middle crossed
    if (this.isIndexMiddleCrossed(landmarks)) {
      return "z"
    }

    return "idle"
  }

  private detectCommonGestures(landmarks: HandLandmark[]): Gesture {
    const thumbTip = landmarks[4]
    const indexTip = landmarks[8]
    const middleTip = landmarks[12]
    const ringTip = landmarks[16]
    const pinkyTip = landmarks[20]

    // Wave gesture (hello)
    if (this.isWaveGesture(landmarks)) {
      return "hello"
    }

    // Thumbs up (thanks/yes)
    if (this.isThumbsUp(landmarks)) {
      return "thanks"
    }

    // Thumbs down (no)
    if (this.isThumbsDown(landmarks)) {
      return "no"
    }

    // Stop gesture (wait)
    if (this.isStopGesture(landmarks)) {
      return "wait"
    }

    // Pointing gesture (help)
    if (this.isPointingGesture(landmarks)) {
      return "help"
    }

    return "idle"
  }

  private isFingerExtended(tip: HandLandmark, base: HandLandmark, mcp: HandLandmark): boolean {
    const tipToBase = Math.sqrt(
      Math.pow(tip.x - base.x, 2) + 
      Math.pow(tip.y - base.y, 2) + 
      Math.pow(tip.z - base.z, 2)
    )
    const tipToMcp = Math.sqrt(
      Math.pow(tip.x - mcp.x, 2) + 
      Math.pow(tip.y - mcp.y, 2) + 
      Math.pow(tip.z - mcp.z, 2)
    )
    return tipToBase > tipToMcp
  }

  private isCurvedGesture(landmarks: HandLandmark[]): boolean {
    // Check if fingers form a curved shape
    const indexTip = landmarks[8]
    const middleTip = landmarks[12]
    const ringTip = landmarks[16]
    const pinkyTip = landmarks[20]
    
    const tips = [indexTip, middleTip, ringTip, pinkyTip]
    const distances = tips.map((tip, i) => {
      if (i === 0) return 0
      return Math.sqrt(
        Math.pow(tip.x - tips[i-1].x, 2) + 
        Math.pow(tip.y - tips[i-1].y, 2)
      )
    })
    
    return distances.every((dist, i) => i === 0 || dist < 0.1)
  }

  private isThumbIndexTouching(thumbTip: HandLandmark, indexTip: HandLandmark): boolean {
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + 
      Math.pow(thumbTip.y - indexTip.y, 2) + 
      Math.pow(thumbTip.z - indexTip.z, 2)
    )
    return distance < 0.05
  }

  private isThumbBetweenFingers(landmarks: HandLandmark[]): boolean {
    const thumbTip = landmarks[4]
    const indexBase = landmarks[5]
    const middleBase = landmarks[9]
    
    const thumbToIndex = Math.sqrt(
      Math.pow(thumbTip.x - indexBase.x, 2) + 
      Math.pow(thumbTip.y - indexBase.y, 2)
    )
    const thumbToMiddle = Math.sqrt(
      Math.pow(thumbTip.x - middleBase.x, 2) + 
      Math.pow(thumbTip.y - middleBase.y, 2)
    )
    
    return thumbToIndex < 0.1 && thumbToMiddle < 0.1
  }

  private isThumbIndexCircle(thumbTip: HandLandmark, indexTip: HandLandmark): boolean {
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + 
      Math.pow(thumbTip.y - indexTip.y, 2)
    )
    return distance < 0.08 && distance > 0.03
  }

  private isIndexMiddleCrossed(landmarks: HandLandmark[]): boolean {
    const indexTip = landmarks[8]
    const middleTip = landmarks[12]
    const indexBase = landmarks[5]
    const middleBase = landmarks[9]
    
    // Check if index and middle are crossed
    const indexToMiddle = Math.sqrt(
      Math.pow(indexTip.x - middleTip.x, 2) + 
      Math.pow(indexTip.y - middleTip.y, 2)
    )
    
    return indexToMiddle < 0.05
  }

  private isWaveGesture(landmarks: HandLandmark[]): boolean {
    // Simple wave detection based on hand movement
    const wrist = landmarks[0]
    const indexTip = landmarks[8]
    
    // Check if hand is moving horizontally
    const horizontalMovement = Math.abs(indexTip.x - wrist.x)
    return horizontalMovement > 0.1
  }

  private isThumbsUp(landmarks: HandLandmark[]): boolean {
    const thumbTip = landmarks[4]
    const thumbBase = landmarks[1]
    const indexTip = landmarks[8]
    
    const thumbExtended = this.isFingerExtended(thumbTip, thumbBase, landmarks[2])
    const indexBent = !this.isFingerExtended(indexTip, landmarks[5], landmarks[6])
    
    return thumbExtended && indexBent
  }

  private isThumbsDown(landmarks: HandLandmark[]): boolean {
    const thumbTip = landmarks[4]
    const thumbBase = landmarks[1]
    
    // Thumb pointing down
    return thumbTip.y > thumbBase.y
  }

  private isStopGesture(landmarks: HandLandmark[]): boolean {
    const palm = landmarks[9] // Middle finger base
    const fingers = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]]
    
    // Check if all fingers are extended and spread
    const allExtended = fingers.every((tip, i) => 
      this.isFingerExtended(tip, landmarks[5 + i * 4], landmarks[6 + i * 4])
    )
    
    return allExtended
  }

  private isPointingGesture(landmarks: HandLandmark[]): boolean {
    const indexTip = landmarks[8]
    const indexBase = landmarks[5]
    const middleTip = landmarks[12]
    const middleBase = landmarks[9]
    
    const indexExtended = this.isFingerExtended(indexTip, indexBase, landmarks[6])
    const middleBent = !this.isFingerExtended(middleTip, middleBase, landmarks[10])
    
    return indexExtended && middleBent
  }

  private updateGestureHistory(gesture: Gesture) {
    const now = Date.now()
    
    // Add gesture to history
    this.gestureHistory.push(gesture)
    if (this.gestureHistory.length > 5) {
      this.gestureHistory.shift()
    }

    // Check for stability
    const isStable = this.isGestureStable(gesture)
    
    // Check cooldown
    if (now - this.lastGestureTime < this.gestureCooldown && !isStable) {
      return
    }

    // Only emit if gesture is stable and different from last stable gesture
    if (isStable && gesture !== this.lastStableGesture) {
      this.lastStableGesture = gesture
      this.lastGestureTime = now
      
      const prediction: GesturePrediction = {
        gesture,
        confidence: this.calculateConfidence(gesture),
        text: this.gestureToText[gesture],
        isStable: true
      }
      
      this.onGestureDetected(prediction)
    }
  }

  private isGestureStable(gesture: Gesture): boolean {
    if (this.gestureHistory.length < this.stabilityThreshold) {
      return false
    }
    
    // Check if last N gestures are the same
    const recentGestures = this.gestureHistory.slice(-this.stabilityThreshold)
    return recentGestures.every(g => g === gesture)
  }

  private calculateConfidence(gesture: Gesture): number {
    if (this.gestureHistory.length === 0) return 0
    
    const recentGestures = this.gestureHistory.slice(-5)
    const sameGestures = recentGestures.filter(g => g === gesture).length
    return sameGestures / recentGestures.length
  }

  private resetToIdle() {
    this.gestureHistory = []
    this.lastStableGesture = "idle"
  }

  // Method to update configuration
  updateConfig(config: { 
    confidenceThreshold?: number
    stabilityThreshold?: number
    gestureCooldown?: number
  }) {
    if (config.confidenceThreshold !== undefined) {
      this.confidenceThreshold = config.confidenceThreshold
    }
    if (config.stabilityThreshold !== undefined) {
      this.stabilityThreshold = config.stabilityThreshold
    }
    if (config.gestureCooldown !== undefined) {
      this.gestureCooldown = config.gestureCooldown
    }
  }

  // Method to get current status
  getStatus() {
    return {
      isDetecting: this.isDetecting,
      lastStableGesture: this.lastStableGesture,
      gestureHistory: [...this.gestureHistory],
      confidenceThreshold: this.confidenceThreshold,
      stabilityThreshold: this.stabilityThreshold,
      gestureCooldown: this.gestureCooldown
    }
  }
}
