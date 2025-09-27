"use client"

import { useEffect, useRef, useState } from "react"
import { ThreeAvatar } from "./three-avatar"
import { MediaPipeGestureDetector, detectEmotionFromText, detectGestureFromText, type Gesture } from "@/lib/mediapipe-detector"

interface RealTimeTranslatorProps {
  inputSignLang: string
  outputLang: string
  onTranslationUpdate: (text: string, emotion: string, gesture: Gesture) => void
  className?: string
}

export function RealTimeTranslator({
  inputSignLang,
  outputLang,
  onTranslationUpdate,
  className
}: RealTimeTranslatorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gestureDetectorRef = useRef<MediaPipeGestureDetector | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [currentText, setCurrentText] = useState("")
  const [currentEmotion, setCurrentEmotion] = useState("neutral")
  const [currentGesture, setCurrentGesture] = useState<Gesture>("idle")
  const [isAnimating, setIsAnimating] = useState(false)

  // Real-time text generation based on gestures
  const gestureToText: Record<Gesture, string> = {
    "hello": "Hello! How are you?",
    "thanks": "Thank you very much!",
    "help": "I need help, please.",
    "wait": "Please wait a moment.",
    "repeat": "Can you repeat that?",
    "yes": "Yes, I understand.",
    "no": "No, I don't think so.",
    "idle": ""
  }

  useEffect(() => {
    if (!isActive) return

    let stream: MediaStream | null = null

    const startRealTimeTranslation = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 }, 
          audio: false 
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          
          // Initialize MediaPipe gesture detector
          gestureDetectorRef.current = new MediaPipeGestureDetector(
            videoRef.current,
            (gesture: Gesture) => {
              setCurrentGesture(gesture)
              setIsAnimating(true)
              
              // Generate text from gesture
              const newText = gestureToText[gesture]
              if (newText) {
                setCurrentText(newText)
                
                // Detect emotion from text
                const emotion = detectEmotionFromText(newText)
                setCurrentEmotion(emotion)
                
                // Notify parent component
                onTranslationUpdate(newText, emotion, gesture)
              }
              
              // Stop animation after gesture duration
              setTimeout(() => {
                setIsAnimating(false)
                setCurrentGesture("idle")
              }, 2000)
            }
          )
          
          await gestureDetectorRef.current.startDetection()
        }
      } catch (error) {
        console.error("Failed to start real-time translation:", error)
      }
    }

    startRealTimeTranslation()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (gestureDetectorRef.current) {
        gestureDetectorRef.current.stopDetection()
      }
    }
  }, [isActive, onTranslationUpdate])

  const startTranslation = () => {
    setIsActive(true)
  }

  const stopTranslation = () => {
    setIsActive(false)
    setCurrentText("")
    setCurrentEmotion("neutral")
    setCurrentGesture("idle")
    setIsAnimating(false)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Video Feed */}
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full h-48 object-cover rounded-lg bg-transparent"
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
        
        {/* Overlay Controls */}
        <div className="absolute bottom-2 left-2 flex gap-2">
          {!isActive ? (
            <button
              onClick={startTranslation}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Start Real-time Translation
            </button>
          ) : (
            <button
              onClick={stopTranslation}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Stop Translation
            </button>
          )}
        </div>

        {/* Status Indicator */}
        {isActive && (
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-white bg-black/50 px-2 py-1 rounded">
              {currentGesture !== "idle" ? `Detected: ${currentGesture}` : "Listening..."}
            </span>
          </div>
        )}
      </div>

      {/* 3D Avatar */}
      <div className="h-64 w-full rounded-lg overflow-hidden">
        <ThreeAvatar
          emotion={currentEmotion as any}
          gesture={currentGesture}
          isAnimating={isAnimating}
          className="w-full h-full"
        />
      </div>

      {/* Real-time Text Output */}
      <div className="p-4 bg-card/80 backdrop-blur-sm rounded-lg min-h-20 border border-border/40">
        <h3 className="text-sm font-medium text-foreground mb-2">Real-time Translation:</h3>
        <p className="text-lg text-foreground">
          {currentText || "Waiting for sign language input..."}
        </p>
        {currentGesture !== "idle" && (
          <p className="text-sm text-muted-foreground mt-2">
            Gesture: {currentGesture} | Emotion: {currentEmotion}
          </p>
        )}
      </div>

      {/* Language Info */}
      <div className="text-sm text-muted-foreground text-center">
        Translating from <span className="font-medium">{inputSignLang}</span> to{" "}
        <span className="font-medium">{outputLang}</span>
      </div>
    </div>
  )
}
