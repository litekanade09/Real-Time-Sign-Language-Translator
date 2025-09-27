"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Bubble = { who: "Signer" | "Speaker"; text: string; translated: string }

export function ConversationMode({
  inputSignLang,
  outputLang,
  captionSize,
  announce,
  vibrate,
}: {
  inputSignLang: string
  outputLang: string
  captionSize: "sm" | "md" | "lg"
  announce: (s: string) => void
  vibrate: boolean
}) {
  const [messages, setMessages] = useState<Bubble[]>([
    { who: "Speaker", text: "Hello!", translated: "👋" },
    { who: "Signer", text: "👍 Thanks", translated: "Thanks" },
  ])
  const [input, setInput] = useState("")

  const sizeClass = captionSize === "lg" ? "text-lg" : captionSize === "md" ? "text-base" : "text-sm"

  function add(who: "Signer" | "Speaker") {
    if (!input.trim()) return
    const translated =
      who === "Signer" ? input + " (to " + outputLang + ")" : "🤟 " + input + " (" + inputSignLang + ")"
    setMessages((m) => [...m, { who, text: input, translated }])
    setInput("")
    announce("Message added in conversation")
    if (vibrate && "vibrate" in navigator) navigator.vibrate(30)
  }

  return (
    <Card className="p-4">
      <div className="mb-3 text-sm text-muted-foreground">
        Chat-style conversation. Each message shows original and auto-translation.
      </div>
      <div className="flex flex-col gap-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-lg px-3 py-2",
              m.who === "Speaker" ? "self-start bg-muted" : "self-end bg-primary/20",
            )}
          >
            <div className="text-xs opacity-70 mb-1">{m.who}</div>
            <div className={sizeClass}>{m.text}</div>
            <div className="text-xs mt-1 text-muted-foreground">→ {m.translated}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message or description of sign..."
          aria-label="Conversation input"
        />
        <Button onClick={() => add("Speaker")} className="shrink-0">
          Send as Speaker
        </Button>
        <Button variant="secondary" onClick={() => add("Signer")} className="shrink-0">
          Send as Signer
        </Button>
      </div>
    </Card>
  )
}
