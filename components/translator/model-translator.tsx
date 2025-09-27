"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ThreeAvatar } from "./three-avatar"
import { ModelDetector, type ModelPrediction } from "@/lib/model-detector"
import { type Gesture } from "@/lib/mediapipe-detector"

interface ModelTranslatorProps {
  inputSignLang: string
  outputLang: string
  onTranslationUpdate: (text: string, emotion: string, gesture: Gesture) => void
  className?: string
}

export function ModelTranslator({
  inputSignLang,
  outputLang,
  onTranslationUpdate,
  className
}: ModelTranslatorProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const modelDetectorRef = useRef<ModelDetector | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [currentText, setCurrentText] = useState("")
  const [currentEmotion, setCurrentEmotion] = useState("neutral")
  const [currentGesture, setCurrentGesture] = useState<Gesture>("idle")
  const [isAnimating, setIsAnimating] = useState(false)
  const [serverStatus, setServerStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [modelConfig, setModelConfig] = useState({
    serverUrl: 'http://localhost:5000',
    confidenceThreshold: 0.7,
    frameSkip: 5,
    maxRetries: 3
  })

  // Check server connection on mount
  useEffect(() => {
    checkServerConnection()
  }, [])

  const checkServerConnection = async () => {
    setServerStatus('checking')
    try {
      const response = await fetch(`${modelConfig.serverUrl}/health`)
      const data = await response.json()
      
      if (data.status === 'healthy' && data.model_loaded) {
        setServerStatus('connected')
      } else {
        setServerStatus('disconnected')
      }
    } catch (error) {
      console.error('Server connection failed:', error)
      setServerStatus('disconnected')
    }
  }

  // Emotion detection from text
  const detectEmotionFromText = (text: string): string => {
    const lowerText = text.toLowerCase()
    
    if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('thanks')) {
      return 'happy'
    } else if (lowerText.includes('help') || lowerText.includes('urgent')) {
      return 'angry'
    } else if (lowerText.includes('wait') || lowerText.includes('please')) {
      return 'confused'
    } else if (lowerText.includes('yes') || lowerText.includes('no')) {
      return 'neutral'
    }
    
    return 'neutral'
  }

  useEffect(() => {
    if (!isActive) return

    let stream: MediaStream | null = null

    const startModelTranslation = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 }, 
          audio: false 
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          
          // Initialize model detector
          modelDetectorRef.current = new ModelDetector(
            videoRef.current,
            (prediction: ModelPrediction) => {
              setCurrentGesture(prediction.gesture)
              setIsAnimating(true)
              
              // Update text if confidence is high enough
              if (prediction.text && prediction.confidence >= modelConfig.confidenceThreshold) {
                setCurrentText(prediction.text)
                
                // Detect emotion from text
                const emotion = detectEmotionFromText(prediction.text)
                setCurrentEmotion(emotion)
                
                // Notify parent component
                onTranslationUpdate(prediction.text, emotion, prediction.gesture)
              }
              
              // Stop animation after gesture duration
              setTimeout(() => {
                setIsAnimating(false)
                setCurrentGesture("idle")
              }, 2000)
            },
            modelConfig
          )
          
          await modelDetectorRef.current.startDetection()
        }
      } catch (error) {
        console.error("Failed to start model translation:", error)
      }
    }

    startModelTranslation()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (modelDetectorRef.current) {
        modelDetectorRef.current.stopDetection()
      }
    }
  }, [isActive, modelConfig, onTranslationUpdate])

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

  const updateModelConfig = (newConfig: Partial<typeof modelConfig>) => {
    setModelConfig(prev => ({ ...prev, ...newConfig }))
    
    // Update detector config if it exists
    if (modelDetectorRef.current) {
      modelDetectorRef.current.updateConfig(newConfig)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Server Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              serverStatus === 'connected' ? 'bg-green-500' : 
              serverStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-sm font-medium">
              Model Server: {
                serverStatus === 'connected' ? 'Connected' :
                serverStatus === 'checking' ? 'Checking...' : 'Disconnected'
              }
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkServerConnection}
            disabled={serverStatus === 'checking'}
          >
            Refresh
          </Button>
        </div>
      </Card>

      {/* Model Configuration */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Model Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Server URL</label>
            <input
              type="text"
              value={modelConfig.serverUrl}
              onChange={(e) => updateModelConfig({ serverUrl: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md"
              placeholder="http://localhost:5000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Confidence Threshold: {modelConfig.confidenceThreshold}
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={modelConfig.confidenceThreshold}
              onChange={(e) => updateModelConfig({ confidenceThreshold: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Frame Skip: {modelConfig.frameSkip}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={modelConfig.frameSkip}
              onChange={(e) => updateModelConfig({ frameSkip: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Max Retries: {modelConfig.maxRetries}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={modelConfig.maxRetries}
              onChange={(e) => updateModelConfig({ maxRetries: parseInt(e.target.value) })}
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
                <Button onClick={startTranslation} disabled={serverStatus !== 'connected'}>
                  Start Model Translation
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
        <h3 className="text-lg font-semibold mb-4">Translation Output</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Detected Text:</label>
            <div className="p-3 bg-muted rounded-md min-h-[3rem] flex items-center">
              {currentText || "No text detected..."}
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
