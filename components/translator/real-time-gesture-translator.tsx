"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ThreeAvatar } from "./three-avatar"
import { RealTimeGestureDetector, type GesturePrediction, type Gesture } from "@/lib/real-time-gesture-detector"

interface RealTimeGestureTranslatorProps {
  inputSignLang: string
  outputLang: string
  onTranslationUpdate: (text: string, emotion: string, gesture: Gesture) => void
  className?: string
}

export function RealTimeGestureTranslator({
  inputSignLang,
  outputLang,
  onTranslationUpdate,
  className
}: RealTimeGestureTranslatorProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const gestureDetectorRef = useRef<RealTimeGestureDetector | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [currentText, setCurrentText] = useState("")
  const [currentEmotion, setCurrentEmotion] = useState("neutral")
  const [currentGesture, setCurrentGesture] = useState<Gesture>("idle")
  const [isAnimating, setIsAnimating] = useState(false)
  const [detectionStatus, setDetectionStatus] = useState({
    isDetecting: false,
    lastGesture: "idle" as Gesture,
    confidence: 0,
    stability: 0
  })
  const [config, setConfig] = useState({
    confidenceThreshold: 0.7,
    stabilityThreshold: 3,
    gestureCooldown: 1000
  })
  const [translationHistory, setTranslationHistory] = useState<string[]>([])

  // Emotion detection from gesture
  const detectEmotionFromGesture = (gesture: Gesture): string => {
    switch (gesture) {
      case "hello":
      case "thanks":
        return "happy"
      case "help":
      case "wait":
        return "confused"
      case "yes":
        return "happy"
      case "no":
        return "angry"
      default:
        return "neutral"
    }
  }

  useEffect(() => {
    if (!isActive) return

    let stream: MediaStream | null = null

    const startGestureTranslation = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 }, 
          audio: false 
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          
          // Initialize gesture detector
          gestureDetectorRef.current = new RealTimeGestureDetector(
            videoRef.current,
            (prediction: GesturePrediction) => {
              setCurrentGesture(prediction.gesture)
              setIsAnimating(true)
              
              // Update text if gesture is stable and has text
              if (prediction.text && prediction.isStable) {
                setCurrentText(prediction.text)
                
                // Add to translation history
                setTranslationHistory(prev => {
                  const newHistory = [...prev, prediction.text]
                  return newHistory.slice(-10) // Keep last 10 translations
                })
                
                // Detect emotion from gesture
                const emotion = detectEmotionFromGesture(prediction.gesture)
                setCurrentEmotion(emotion)
                
                // Notify parent component
                onTranslationUpdate(prediction.text, emotion, prediction.gesture)
              }
              
              // Update detection status
              setDetectionStatus(prev => ({
                ...prev,
                lastGesture: prediction.gesture,
                confidence: prediction.confidence,
                stability: prediction.isStable ? 1 : 0
              }))
              
              // Stop animation after gesture duration
              setTimeout(() => {
                setIsAnimating(false)
                if (prediction.gesture !== "idle") {
                  setCurrentGesture("idle")
                }
              }, 2000)
            }
          )
          
          // Update detector config
          gestureDetectorRef.current.updateConfig(config)
          
          await gestureDetectorRef.current.startDetection()
          setDetectionStatus(prev => ({ ...prev, isDetecting: true }))
        }
      } catch (error) {
        console.error("Failed to start gesture translation:", error)
      }
    }

    startGestureTranslation()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (gestureDetectorRef.current) {
        gestureDetectorRef.current.stopDetection()
        setDetectionStatus(prev => ({ ...prev, isDetecting: false }))
      }
    }
  }, [isActive, config, onTranslationUpdate])

  const startTranslation = () => {
    setIsActive(true)
  }

  const stopTranslation = () => {
    setIsActive(false)
    setCurrentText("")
    setCurrentEmotion("neutral")
    setCurrentGesture("idle")
    setIsAnimating(false)
    setTranslationHistory([])
  }

  const updateConfig = (newConfig: Partial<typeof config>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
    
    // Update detector config if it exists
    if (gestureDetectorRef.current) {
      gestureDetectorRef.current.updateConfig(newConfig)
    }
  }

  const clearHistory = () => {
    setTranslationHistory([])
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Detection Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${detectionStatus.isDetecting ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              Hand Detection: {detectionStatus.isDetecting ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Last: {detectionStatus.lastGesture} | 
            Confidence: {Math.round(detectionStatus.confidence * 100)}% | 
            Stable: {detectionStatus.stability ? 'Yes' : 'No'}
          </div>
        </div>
      </Card>

      {/* Configuration */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Detection Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Confidence: {config.confidenceThreshold}
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={config.confidenceThreshold}
              onChange={(e) => updateConfig({ confidenceThreshold: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Stability: {config.stabilityThreshold}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={config.stabilityThreshold}
              onChange={(e) => updateConfig({ stabilityThreshold: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Cooldown: {config.gestureCooldown}ms
            </label>
            <input
              type="range"
              min="100"
              max="3000"
              step="100"
              value={config.gestureCooldown}
              onChange={(e) => updateConfig({ gestureCooldown: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Video and Avatar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Feed */}
        <Card className="relative overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Camera Feed - {inputSignLang}</h3>
          </div>
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-64 object-cover bg-gray-100"
            />
            {!isActive && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Button onClick={startTranslation}>
                  Start Real-time Translation
                </Button>
              </div>
            )}
          </div>
          {isActive && (
            <div className="p-4 border-t">
              <Button onClick={stopTranslation} variant="destructive">
                Stop Translation
              </Button>
            </div>
          )}
        </Card>

        {/* 3D Avatar */}
        <Card className="relative overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">3D Avatar - {outputLang}</h3>
          </div>
          <div className="h-64">
            <ThreeAvatar
              emotion={currentEmotion as any}
              gesture={currentGesture}
              isAnimating={isAnimating}
              className="w-full h-full"
            />
          </div>
        </Card>
      </div>

      {/* Real-time Translation Output */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Real-time Translation</h3>
          <Button variant="outline" size="sm" onClick={clearHistory}>
            Clear History
          </Button>
        </div>
        
        <div className="space-y-4">
          {/* Current Translation */}
          <div>
            <label className="block text-sm font-medium mb-2">Current Translation:</label>
            <div className="p-4 bg-muted rounded-md min-h-[4rem] flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">
                {currentText || "Show your hand gesture..."}
              </span>
            </div>
          </div>

          {/* Gesture Info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Gesture:</label>
              <div className="p-2 bg-muted rounded-md text-center">
                {currentGesture}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Emotion:</label>
              <div className="p-2 bg-muted rounded-md text-center">
                {currentEmotion}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confidence:</label>
              <div className="p-2 bg-muted rounded-md text-center">
                {Math.round(detectionStatus.confidence * 100)}%
              </div>
            </div>
          </div>

          {/* Translation History */}
          {translationHistory.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Translation History:</label>
              <div className="p-3 bg-muted rounded-md max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {translationHistory.map((text, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary/10 text-primary rounded text-sm"
                    >
                      {text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
