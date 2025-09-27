"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { detectEmotionFromText, detectGestureFromText, type Gesture } from "@/lib/mediapipe-detector"

export function OutputPanel({
  outputLang,
  captionSize,
  highlightKeywords,
  keywords,
  announce,
}: {
  outputLang: string
  captionSize: "sm" | "md" | "lg"
  highlightKeywords: boolean
  keywords: string[]
  announce: (msg: string) => void
}) {
  const [transcript, setTranscript] = useState<string>("Ready.")
  const [speaking, setSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentGesture, setCurrentGesture] = useState<Gesture>("idle")
  const [currentEmotion, setCurrentEmotion] = useState<string>("neutral")
  const areaRef = useRef<HTMLDivElement | null>(null)
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Mock stream appends text every few seconds when "speaking" is on
  useEffect(() => {
    if (!speaking) return
    const id = setInterval(() => {
      const newText = "Hello there, how can I help you?"
      setTranscript((t) => t + " " + newText)
      
      // Detect emotion and gesture from new text
      const emotion = detectEmotionFromText(newText)
      const gesture = detectGestureFromText(newText)
      
      setCurrentEmotion(emotion)
      setCurrentGesture(gesture)
      
      // Reset gesture after duration
      setTimeout(() => {
        setCurrentGesture("idle")
      }, 2000)
      
      announce("New caption added")
    }, 2500)
    return () => clearInterval(id)
  }, [speaking, announce])

  function speakNow() {
    if (isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
      return
    }
    
    const utter = new SpeechSynthesisUtterance(transcript)
    utter.lang = outputLang === "Hindi" ? "hi-IN" : outputLang === "Marathi" ? "mr-IN" : "en-US"
    utter.rate = 1
    utter.pitch = 1
    utter.volume = 1
    
    speechRef.current = utter
    
    utter.onpause = () => setIsPaused(true)
    utter.onresume = () => setIsPaused(false)
    utter.onend = () => {
      setIsPaused(false)
      speechRef.current = null
    }
    
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
  }

  function pauseAudio() {
    if (window.speechSynthesis.speaking && !isPaused) {
      window.speechSynthesis.pause()
      setIsPaused(true)
    } else if (isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    }
  }

  function stopAudio() {
    window.speechSynthesis.cancel()
    setIsPaused(false)
    speechRef.current = null
  }

  const sizeClass =
    captionSize === "lg"
      ? "text-2xl leading-relaxed"
      : captionSize === "md"
        ? "text-xl leading-relaxed"
        : "text-base leading-relaxed"

  const highlighted = useMemo(() => {
    if (!highlightKeywords) return transcript
    let html = transcript
    keywords.forEach((k) => {
      const re = new RegExp(`\\b(${k})\\b`, "gi")
      html = html.replace(re, '<mark class="bg-accent text-accent-foreground rounded px-1">$1</mark>')
    })
    return html
  }, [transcript, highlightKeywords, keywords])

  return (
    <Card role="region" aria-live="polite" aria-label="Translated output and audio controls" className="flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-pretty">Translated Output · {outputLang}</h2>
        <div className="flex gap-2">
          <Button onClick={() => setSpeaking((s) => !s)} aria-pressed={speaking}>
            {speaking ? "Pause" : "Start"} captions
          </Button>
          <Button variant="secondary" onClick={speakNow}>
            {isPaused ? "Resume" : "Play"} audio
          </Button>
          <Button variant="outline" onClick={pauseAudio} disabled={typeof window === 'undefined' || (!window.speechSynthesis.speaking && !isPaused)}>
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Button variant="outline" onClick={stopAudio} disabled={typeof window === 'undefined' || (!window.speechSynthesis.speaking && !isPaused)}>
            Stop
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div
          ref={areaRef}
          className={sizeClass + " min-h-40 rounded-md border border-border/60 bg-card/50 p-4"}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>

      <div className="px-4 pb-4 text-sm text-muted-foreground">
        <div className="rounded-md border border-border/60 bg-card/50 p-3">
          <div className="font-medium mb-1">Emotion</div>
          <div className="text-2xl">
            {currentEmotion === "happy" && "😊"}
            {currentEmotion === "sad" && "😢"}
            {currentEmotion === "angry" && "😠"}
            {currentEmotion === "surprised" && "😲"}
            {currentEmotion === "confused" && "😕"}
            {currentEmotion === "neutral" && "🙂"}
            {" "}
            {currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)}
          </div>
          <div className="text-xs mt-1 text-muted-foreground">
            Gesture: {currentGesture}
          </div>
        </div>
      </div>
    </Card>
  )
}
