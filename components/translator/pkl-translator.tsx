"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ThreeAvatar } from "./three-avatar"
import { PKLModelDetector, type PKLPrediction } from "@/lib/pkl-model-detector"
import { loadPKLModel } from "@/lib/load-pkl-model"
import { type Gesture } from "@/lib/mediapipe-detector"

interface PKLTranslatorProps {
  inputSignLang: string
  outputLang: string
  onTranslationUpdate: (text: string, emotion: string, gesture: Gesture) => void
  className?: string
}

export function PKLTranslator({
  inputSignLang,
  outputLang,
  onTranslationUpdate,
  className
}: PKLTranslatorProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const pklDetectorRef = useRef<PKLModelDetector | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [currentText, setCurrentText] = useState("")
  const [currentEmotion, setCurrentEmotion] = useState("neutral")
  const [currentGesture, setCurrentGesture] = useState<Gesture>("idle")
  const [isAnimating, setIsAnimating] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [predictionStats, setPredictionStats] = useState({
    total: 0,
    correct: 0,
    accuracy: 0,
    uniqueLetters: 0
  })
  const [config, setConfig] = useState({
    confidenceThreshold: 0.7,
    frameSkip: 10
  })

  // Load the PKL model on mount
  useEffect(() => {
    loadModel()
  }, [])

  const loadModel = async () => {
    try {
      setLoading(true)
      const modelData = await loadPKLModel()
      
      if (modelData.length > 0) {
        setModelLoaded(true)
        setPredictionStats({
          total: modelData.length,
          correct: modelData.filter(p => p.pred_label === p.true_label).length,
          accuracy: Math.round((modelData.filter(p => p.pred_label === p.true_label).length / modelData.length) * 10000) / 100,
          uniqueLetters: [...new Set(modelData.map(p => p.pred_label))].length
        })
        console.log('PKL Model loaded successfully')
      }
    } catch (error) {
      console.error('Failed to load PKL model:', error)
    } finally {
      setLoading(false)
    }
  }

  // Emotion detection from letter
  const detectEmotionFromLetter = (letter: string): string => {
    const vowels = 'aeiou'
    const numbers = '0123456789'
    
    if (vowels.includes(letter.toLowerCase())) {
      return 'happy'
    } else if (numbers.includes(letter)) {
      return 'neutral'
    } else {
      return 'confused'
    }
  }

  useEffect(() => {
    if (!isActive || !modelLoaded) return

    let stream: MediaStream | null = null

    const startPKLTranslation = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 }, 
          audio: false 
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          
          // Load model data
          const modelData = await loadPKLModel()
          
          // Initialize PKL detector
          pklDetectorRef.current = new PKLModelDetector(
            videoRef.current,
            (prediction: PKLPrediction) => {
              setCurrentGesture(prediction.gesture)
              setIsAnimating(true)
              
              // Update text if confidence is high enough
              if (prediction.letter && prediction.confidence >= config.confidenceThreshold) {
                setCurrentText(prediction.letter)
                
                // Detect emotion from letter
                const emotion = detectEmotionFromLetter(prediction.letter)
                setCurrentEmotion(emotion)
                
                // Notify parent component
                onTranslationUpdate(prediction.letter, emotion, prediction.gesture)
              }
              
              // Stop animation after gesture duration
              setTimeout(() => {
                setIsAnimating(false)
                setCurrentGesture("idle")
              }, 2000)
            },
            modelData
          )
          
          // Update detector config
          pklDetectorRef.current.updateConfig(config)
          
          await pklDetectorRef.current.startDetection()
        }
      } catch (error) {
        console.error("Failed to start PKL translation:", error)
      }
    }

    startPKLTranslation()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (pklDetectorRef.current) {
        pklDetectorRef.current.stopDetection()
      }
    }
  }, [isActive, modelLoaded, config, onTranslationUpdate])

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

  const updateConfig = (newConfig: Partial<typeof config>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
    
    // Update detector config if it exists
    if (pklDetectorRef.current) {
      pklDetectorRef.current.updateConfig(newConfig)
    }
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading PKL Model...</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Model Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${modelLoaded ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              PKL Model: {modelLoaded ? 'Loaded' : 'Not Loaded'}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadModel}
            disabled={loading}
          >
            Reload Model
          </Button>
        </div>
        
        {modelLoaded && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Predictions:</span>
              <div className="font-semibold">{predictionStats.total}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Accuracy:</span>
              <div className="font-semibold">{predictionStats.accuracy}%</div>
            </div>
            <div>
              <span className="text-muted-foreground">Unique Letters:</span>
              <div className="font-semibold">{predictionStats.uniqueLetters}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Correct:</span>
              <div className="font-semibold">{predictionStats.correct}</div>
            </div>
          </div>
        )}
      </Card>

      {/* Model Configuration */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Model Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Confidence Threshold: {config.confidenceThreshold}
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
              Frame Skip: {config.frameSkip}
            </label>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={config.frameSkip}
              onChange={(e) => updateConfig({ frameSkip: parseInt(e.target.value) })}
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
                <Button 
                  onClick={startTranslation} 
                  disabled={!modelLoaded}
                >
                  Start PKL Translation
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

      {/* Translation Output */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">ASL Letter Translation</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Detected Letter:</label>
            <div className="p-3 bg-muted rounded-md min-h-[3rem] flex items-center justify-center">
              <span className="text-4xl font-bold text-primary">
                {currentText || "?"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          </div>
        </div>
      </Card>
    </div>
  )
}
