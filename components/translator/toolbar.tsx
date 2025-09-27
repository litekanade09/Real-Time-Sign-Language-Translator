"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { useEffect } from "react"

type Props = {
  mode: "split" | "conversation" | "realtime" | "pkl" | "gesture"
  onModeChange: (m: "split" | "conversation" | "realtime" | "pkl" | "gesture") => void
  inputSignLang: string
  onChangeInputSignLang: (s: string) => void
  outputLang: string
  onChangeOutputLang: (s: string) => void
  captionSize: "sm" | "md" | "lg"
  onCaptionSize: (s: "sm" | "md" | "lg") => void
  narration: boolean
  onNarration: (b: boolean) => void
  vibrate: boolean
  onVibrate: (b: boolean) => void
  highlightKeywords: boolean
  onHighlightKeywords: (b: boolean) => void
  onStartTranslate: () => void
  onStopTranslate: () => void
  fontSize: "xs" | "sm" | "base" | "lg" | "xl" | "2xl"
  onFontSize: (s: "xs" | "sm" | "base" | "lg" | "xl" | "2xl") => void
  toggleEffects: boolean
  onToggleEffects: (b: boolean) => void
  animationSpeed: "slow" | "normal" | "fast"
  onAnimationSpeed: (s: "slow" | "normal" | "fast") => void
  contrast: "normal" | "high" | "low"
  onContrast: (s: "normal" | "high" | "low") => void
}

export function Toolbar(props: Props) {
  const {
    mode,
    onModeChange,
    inputSignLang,
    onChangeInputSignLang,
    outputLang,
    onChangeOutputLang,
    captionSize,
    onCaptionSize,
    narration,
    onNarration,
    vibrate,
    onVibrate,
    highlightKeywords,
    onHighlightKeywords,
    onStartTranslate,
    onStopTranslate,
    fontSize,
    onFontSize,
    toggleEffects,
    onToggleEffects,
    animationSpeed,
    onAnimationSpeed,
    contrast,
    onContrast,
  } = props

  // Voice guidance when toolbar mounts
  useEffect(() => {
    if (narration) {
      const utter = new SpeechSynthesisUtterance("Toolbar loaded. Use language selectors and start translation.")
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utter)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <header className="flex flex-col gap-3 border-b border-border/60 p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={mode === "split" ? "default" : "secondary"}
          onClick={() => onModeChange("split")}
          aria-pressed={mode === "split"}
        >
          Split
        </Button>
        <Button
          variant={mode === "conversation" ? "default" : "secondary"}
          onClick={() => onModeChange("conversation")}
          aria-pressed={mode === "conversation"}
        >
          Conversation
        </Button>
        <Button
          variant={mode === "realtime" ? "default" : "secondary"}
          onClick={() => onModeChange("realtime")}
          aria-pressed={mode === "realtime"}
        >
          Real-time
        </Button>
        <Button
          variant={mode === "pkl" ? "default" : "secondary"}
          onClick={() => onModeChange("pkl")}
          aria-pressed={mode === "pkl"}
        >
          PKL Model
        </Button>
        <Button
          variant={mode === "gesture" ? "default" : "secondary"}
          onClick={() => onModeChange("gesture")}
          aria-pressed={mode === "gesture"}
        >
          Hand Gestures
        </Button>

        <Select value={inputSignLang} onValueChange={onChangeInputSignLang}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Input Sign" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ASL">ASL</SelectItem>
            <SelectItem value="BSL">BSL</SelectItem>
            <SelectItem value="ISL">ISL</SelectItem>
            <SelectItem value="ISL-India">ISL (India)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={outputLang} onValueChange={onChangeOutputLang}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Output Lang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="English">English</SelectItem>
            <SelectItem value="Hindi">Hindi</SelectItem>
            <SelectItem value="Marathi">Marathi</SelectItem>
            <SelectItem value="Spanish">Spanish</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={onStartTranslate} className="bg-primary text-primary-foreground hover:opacity-90">
          ✋ Sign → Text/Speech
        </Button>
        <Button variant="secondary" onClick={onStartTranslate} aria-label="Speech to Sign">
          🎤 Speech → Sign
        </Button>
        <Button variant="ghost" onClick={onStopTranslate} aria-label="Stop translation">
          Stop
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" aria-label="Open settings">
              Settings
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Accessibility</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onNarration(!narration)} aria-checked={narration} role="menuitemcheckbox">
              Voice narration {narration ? "On" : "Off"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onVibrate(!vibrate)} aria-checked={vibrate} role="menuitemcheckbox">
              Haptic feedback {vibrate ? "On" : "Off"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onHighlightKeywords(!highlightKeywords)}
              aria-checked={highlightKeywords}
              role="menuitemcheckbox"
            >
              Highlight keywords {highlightKeywords ? "On" : "Off"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Display Settings</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => onCaptionSize("sm")}
              aria-checked={captionSize === "sm"}
              role="menuitemradio"
            >
              Caption Size: Small
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onCaptionSize("md")}
              aria-checked={captionSize === "md"}
              role="menuitemradio"
            >
              Caption Size: Medium
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onCaptionSize("lg")}
              aria-checked={captionSize === "lg"}
              role="menuitemradio"
            >
              Caption Size: Large
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Font Size</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => onFontSize("xs")}
              aria-checked={fontSize === "xs"}
              role="menuitemradio"
            >
              Extra Small
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onFontSize("sm")}
              aria-checked={fontSize === "sm"}
              role="menuitemradio"
            >
              Small
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onFontSize("base")}
              aria-checked={fontSize === "base"}
              role="menuitemradio"
            >
              Normal
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onFontSize("lg")}
              aria-checked={fontSize === "lg"}
              role="menuitemradio"
            >
              Large
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onFontSize("xl")}
              aria-checked={fontSize === "xl"}
              role="menuitemradio"
            >
              Extra Large
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onFontSize("2xl")}
              aria-checked={fontSize === "2xl"}
              role="menuitemradio"
            >
              XX Large
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Visual Effects</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onToggleEffects(!toggleEffects)} aria-checked={toggleEffects} role="menuitemcheckbox">
              Toggle Effects {toggleEffects ? "On" : "Off"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Animation Speed</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => onAnimationSpeed("slow")}
              aria-checked={animationSpeed === "slow"}
              role="menuitemradio"
            >
              Slow
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onAnimationSpeed("normal")}
              aria-checked={animationSpeed === "normal"}
              role="menuitemradio"
            >
              Normal
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onAnimationSpeed("fast")}
              aria-checked={animationSpeed === "fast"}
              role="menuitemradio"
            >
              Fast
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Contrast</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => onContrast("low")}
              aria-checked={contrast === "low"}
              role="menuitemradio"
            >
              Low Contrast
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onContrast("normal")}
              aria-checked={contrast === "normal"}
              role="menuitemradio"
            >
              Normal Contrast
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onContrast("high")}
              aria-checked={contrast === "high"}
              role="menuitemradio"
            >
              High Contrast
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
