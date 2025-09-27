"use client"

import { useMemo, useState } from "react"
import { Toolbar } from "@/components/translator/toolbar"
import { VideoPanel } from "@/components/translator/video-panel"
import { OutputPanel } from "@/components/translator/output-panel"
import { ConversationMode } from "@/components/translator/conversation-mode"
import { QuickPhrases } from "@/components/translator/quick-phrases"
import { RealTimeTranslator } from "@/components/translator/real-time-translator"
import { RealTimeGestureTranslator } from "@/components/translator/real-time-gesture-translator"
import { PKLTranslator } from "@/components/translator/pkl-translator"
import { Card } from "@/components/ui/card"
import { type Gesture } from "@/lib/mediapipe-detector"

type Mode = "split" | "conversation" | "realtime" | "pkl" | "gesture"

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("split")
  const [inputSignLang, setInputSignLang] = useState("ASL")
  const [outputLang, setOutputLang] = useState("English")
  const [captionSize, setCaptionSize] = useState<"sm" | "md" | "lg">("lg")
  const [narration, setNarration] = useState(true)
  const [vibrate, setVibrate] = useState(false)
  const [highlightKeywords, setHighlightKeywords] = useState(true)
  const [detectedGesture, setDetectedGesture] = useState<Gesture>("idle")
  const [realTimeText, setRealTimeText] = useState("")
  const [realTimeEmotion, setRealTimeEmotion] = useState("neutral")

  const keywords = useMemo(() => ["urgent", "help", "please", "thanks"], [])

  // Voice narration for status for blind users
  function speak(text: string) {
    if (!narration || typeof window === "undefined") return
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 1
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
  }

  // UI actions shared
  const onStartTranslate = () => {
    speak("Translation started")
    if (vibrate && "vibrate" in navigator) navigator.vibrate(40)
  }

  const onStopTranslate = () => {
    speak("Translation stopped")
    if (vibrate && "vibrate" in navigator) navigator.vibrate([20, 20, 20])
  }

  const onGestureDetected = (gesture: Gesture) => {
    setDetectedGesture(gesture)
    speak(`Gesture detected: ${gesture}`)
    if (vibrate && "vibrate" in navigator) navigator.vibrate(50)
  }

  const onRealTimeTranslation = (text: string, emotion: string, gesture: Gesture) => {
    setRealTimeText(text)
    setRealTimeEmotion(emotion)
    setDetectedGesture(gesture)
    speak(`Real-time translation: ${text}`)
    if (vibrate && "vibrate" in navigator) navigator.vibrate(100)
  }

  return (
    <main className="min-h-[100svh] px-4 py-4 md:px-6 md:py-6">
      <Card className="mx-auto max-w-[1200px] bg-card/60 backdrop-blur border-border/60">
        <Toolbar
          mode={mode}
          onModeChange={setMode}
          inputSignLang={inputSignLang}
          onChangeInputSignLang={setInputSignLang}
          outputLang={outputLang}
          onChangeOutputLang={setOutputLang}
          captionSize={captionSize}
          onCaptionSize={setCaptionSize}
          narration={narration}
          onNarration={setNarration}
          vibrate={vibrate}
          onVibrate={setVibrate}
          highlightKeywords={highlightKeywords}
          onHighlightKeywords={setHighlightKeywords}
          onStartTranslate={onStartTranslate}
          onStopTranslate={onStopTranslate}
        />

        {mode === "split" ? (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-6">
            <VideoPanel
              signLanguage={inputSignLang}
              onStart={onStartTranslate}
              onStop={onStopTranslate}
              announce={(s) => speak(s)}
              onGestureDetected={onGestureDetected}
            />
            <OutputPanel
              outputLang={outputLang}
              captionSize={captionSize}
              highlightKeywords={highlightKeywords}
              keywords={keywords}
              announce={(s) => speak(s)}
            />
          </section>
        ) : mode === "conversation" ? (
          <section className="p-4 md:p-6">
            <ConversationMode
              inputSignLang={inputSignLang}
              outputLang={outputLang}
              captionSize={captionSize}
              announce={(s) => speak(s)}
              vibrate={vibrate}
            />
          </section>
        ) : mode === "realtime" ? (
          <section className="p-4 md:p-6">
            <RealTimeTranslator
              inputSignLang={inputSignLang}
              outputLang={outputLang}
              onTranslationUpdate={onRealTimeTranslation}
              className="max-w-4xl mx-auto"
            />
          </section>
        ) : mode === "gesture" ? (
          <section className="p-4 md:p-6">
            <RealTimeGestureTranslator
              inputSignLang={inputSignLang}
              outputLang={outputLang}
              onTranslationUpdate={onRealTimeTranslation}
              className="max-w-6xl mx-auto"
            />
          </section>
        ) : (
          <section className="p-4 md:p-6">
            <PKLTranslator
              inputSignLang={inputSignLang}
              outputLang={outputLang}
              onTranslationUpdate={onRealTimeTranslation}
              className="max-w-6xl mx-auto"
            />
          </section>
        )}

        <section className="p-4 md:p-6 border-t border-border/60">
          <QuickPhrases
            onSpeak={(text) => {
              speak(text)
              if (vibrate && "vibrate" in navigator) navigator.vibrate(35)
            }}
          />
        </section>
      </Card>

      <footer className="mx-auto max-w-[1200px] px-2 py-4 text-center text-sm text-muted-foreground">
        <span className="sr-only">Accessibility tips</span>
        Use Tab/Shift+Tab to navigate. Captions area is live region. Toggle narration in Settings.
      </footer>
    </main>
  )
}
