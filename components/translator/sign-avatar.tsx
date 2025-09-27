"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type Emotion = "neutral" | "happy" | "sad" | "angry" | "surprised" | "confused"
type Gesture = "idle" | "hello" | "thanks" | "help" | "wait" | "repeat" | "yes" | "no"

interface SignAvatarProps {
  emotion?: Emotion
  gesture?: Gesture
  isAnimating?: boolean
  className?: string
}

export function SignAvatar({ 
  emotion = "neutral", 
  gesture = "idle", 
  isAnimating = false,
  className 
}: SignAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [currentFrame, setCurrentFrame] = useState(0)

  // Animation frames for different gestures
  const gestureFrames = {
    idle: [0, 1, 2, 3, 4, 5, 4, 3, 2, 1],
    hello: [10, 11, 12, 13, 14, 15, 14, 13, 12, 11],
    thanks: [20, 21, 22, 23, 24, 25, 24, 23, 22, 21],
    help: [30, 31, 32, 33, 34, 35, 34, 33, 32, 31],
    wait: [40, 41, 42, 43, 44, 45, 44, 43, 42, 41],
    repeat: [50, 51, 52, 53, 54, 55, 54, 53, 52, 51],
    yes: [60, 61, 62, 63, 64, 65, 64, 63, 62, 61],
    no: [70, 71, 72, 73, 74, 75, 74, 73, 72, 71]
  }

  const emotionColors = {
    neutral: { skin: "#F4C2A1", shirt: "#4A90E2", background: "#E8F4FD" },
    happy: { skin: "#F4C2A1", shirt: "#50C878", background: "#E8F8E8" },
    sad: { skin: "#E8B4A0", shirt: "#6B73FF", background: "#F0F0FF" },
    angry: { skin: "#F4A460", shirt: "#FF6B6B", background: "#FFE8E8" },
    surprised: { skin: "#F4C2A1", shirt: "#FFD93D", background: "#FFF8E8" },
    confused: { skin: "#E8B4A0", shirt: "#9B59B6", background: "#F8E8FF" }
  }

  const drawAvatar = (ctx: CanvasRenderingContext2D, frame: number, emotion: Emotion) => {
    const colors = emotionColors[emotion]
    const canvas = ctx.canvas
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Clear canvas
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Animation timing
    const time = Date.now() * 0.003
    const breathe = Math.sin(time) * 2
    const gestureOffset = Math.sin(time * 2) * 3

    // Head
    ctx.fillStyle = colors.skin
    ctx.beginPath()
    ctx.arc(centerX, centerY - 40 + breathe, 35, 0, Math.PI * 2)
    ctx.fill()

    // Hair
    ctx.fillStyle = "#2C1810"
    ctx.beginPath()
    ctx.arc(centerX, centerY - 50 + breathe, 38, 0, Math.PI * 2)
    ctx.fill()

    // Eyes
    ctx.fillStyle = "#2C1810"
    const eyeY = centerY - 45 + breathe
    ctx.beginPath()
    ctx.arc(centerX - 12, eyeY, 3, 0, Math.PI * 2)
    ctx.arc(centerX + 12, eyeY, 3, 0, Math.PI * 2)
    ctx.fill()

    // Mouth based on emotion
    ctx.strokeStyle = "#2C1810"
    ctx.lineWidth = 2
    ctx.beginPath()
    const mouthY = centerY - 25 + breathe
    switch (emotion) {
      case "happy":
        ctx.arc(centerX, mouthY, 8, 0, Math.PI)
        break
      case "sad":
        ctx.arc(centerX, mouthY + 5, 8, Math.PI, 0)
        break
      case "angry":
        ctx.moveTo(centerX - 8, mouthY)
        ctx.lineTo(centerX + 8, mouthY)
        break
      case "surprised":
        ctx.arc(centerX, mouthY, 4, 0, Math.PI * 2)
        break
      default:
        ctx.moveTo(centerX - 6, mouthY)
        ctx.lineTo(centerX + 6, mouthY)
    }
    ctx.stroke()

    // Body (shirt)
    ctx.fillStyle = colors.shirt
    ctx.fillRect(centerX - 30, centerY - 5 + breathe, 60, 80)

    // Arms and hands based on gesture
    const armY = centerY + 10 + breathe
    const handY = centerY + 40 + breathe + gestureOffset

    // Left arm
    ctx.fillStyle = colors.skin
    ctx.fillRect(centerX - 35, armY, 12, 35)
    
    // Right arm
    ctx.fillRect(centerX + 23, armY, 12, 35)

    // Hands based on gesture
    drawHand(ctx, centerX - 29, handY, gesture, "left", colors.skin)
    drawHand(ctx, centerX + 29, handY, gesture, "right", colors.skin)

    // Gesture indicators (sparkles/effects)
    if (isAnimating) {
      drawGestureEffects(ctx, centerX, handY, gesture, time)
    }
  }

  const drawHand = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    gesture: Gesture, 
    side: "left" | "right",
    skinColor: string
  ) => {
    ctx.fillStyle = skinColor
    
    // Hand base
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, Math.PI * 2)
    ctx.fill()

    // Fingers based on gesture
    const fingerPositions = getFingerPositions(gesture, side)
    
    fingerPositions.forEach((finger, index) => {
      ctx.beginPath()
      ctx.arc(x + finger.x, y + finger.y, 3, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  const getFingerPositions = (gesture: Gesture, side: "left" | "right") => {
    const basePositions = [
      { x: -4, y: -8 }, // Thumb
      { x: -2, y: -12 }, // Index
      { x: 0, y: -12 },  // Middle
      { x: 2, y: -12 },  // Ring
      { x: 4, y: -12 }   // Pinky
    ]

    switch (gesture) {
      case "hello":
        return side === "right" 
          ? [{ x: -4, y: -8 }, { x: -2, y: -12 }, { x: 0, y: -12 }, { x: 2, y: -12 }, { x: 4, y: -12 }]
          : [{ x: -4, y: -8 }, { x: -2, y: -12 }, { x: 0, y: -12 }, { x: 2, y: -12 }, { x: 4, y: -12 }]
      
      case "thanks":
        return side === "right"
          ? [{ x: -4, y: -8 }, { x: -2, y: -12 }, { x: 0, y: -12 }, { x: 2, y: -12 }, { x: 4, y: -12 }]
          : [{ x: -4, y: -8 }, { x: -2, y: -12 }, { x: 0, y: -12 }, { x: 2, y: -12 }, { x: 4, y: -12 }]
      
      case "help":
        return [{ x: -4, y: -8 }, { x: -2, y: -12 }, { x: 0, y: -12 }, { x: 2, y: -12 }, { x: 4, y: -12 }]
      
      case "yes":
        return [{ x: -4, y: -8 }, { x: -2, y: -12 }, { x: 0, y: -12 }, { x: 2, y: -12 }, { x: 4, y: -12 }]
      
      case "no":
        return [{ x: -4, y: -8 }, { x: -2, y: -12 }, { x: 0, y: -12 }, { x: 2, y: -12 }, { x: 4, y: -12 }]
      
      default:
        return basePositions
    }
  }

  const drawGestureEffects = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, 
    handY: number, 
    gesture: Gesture, 
    time: number
  ) => {
    ctx.strokeStyle = "#FFD700"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])

    // Draw gesture-specific effects
    switch (gesture) {
      case "hello":
        // Wave effect
        for (let i = 0; i < 3; i++) {
          ctx.beginPath()
          ctx.arc(centerX + 30, handY, 15 + i * 5 + Math.sin(time + i) * 3, 0, Math.PI * 2)
          ctx.stroke()
        }
        break
      
      case "thanks":
        // Heart effect
        ctx.fillStyle = "#FF69B4"
        ctx.beginPath()
        ctx.arc(centerX + 25, handY - 5, 3, 0, Math.PI * 2)
        ctx.arc(centerX + 35, handY - 5, 3, 0, Math.PI * 2)
        ctx.fill()
        break
      
      case "help":
        // Question mark effect
        ctx.fillStyle = "#FF6B6B"
        ctx.font = "16px Arial"
        ctx.fillText("?", centerX + 30, handY)
        break
    }

    ctx.setLineDash([])
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const animate = () => {
      drawAvatar(ctx, currentFrame, emotion)
      setCurrentFrame(prev => (prev + 1) % 60) // 60 frames for smooth animation
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [currentFrame, emotion, gesture, isAnimating])

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        className="w-full h-full rounded-lg"
        aria-label={`Sign language avatar showing ${emotion} emotion with ${gesture} gesture`}
      />
      {isAnimating && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  )
}
