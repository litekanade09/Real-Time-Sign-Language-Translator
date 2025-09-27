"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Phrase = { id: string; text: string }

export function QuickPhrases({ onSpeak }: { onSpeak: (text: string) => void }) {
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [newPhrase, setNewPhrase] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("quick-phrases")
    if (saved) setPhrases(JSON.parse(saved))
    else
      setPhrases([
        { id: "1", text: "Please wait a moment." },
        { id: "2", text: "Can you repeat that?" },
        { id: "3", text: "Thank you!" },
        { id: "4", text: "I need help." },
      ])
  }, [])

  useEffect(() => {
    localStorage.setItem("quick-phrases", JSON.stringify(phrases))
  }, [phrases])

  function addPhrase() {
    if (!newPhrase.trim()) return
    setPhrases((p) => [...p, { id: String(Date.now()), text: newPhrase.trim() }])
    setNewPhrase("")
  }

  function remove(id: string) {
    setPhrases((p) => p.filter((x) => x.id !== id))
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Quick Phrases</h3>
        <div className="flex gap-2">
          <Input
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            placeholder="Add phrase"
            className="h-9 w-56"
            aria-label="New phrase"
          />
          <Button size="sm" onClick={addPhrase}>
            Add
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {phrases.map((p) => (
          <Card key={p.id} className="p-2 flex items-center justify-between">
            <Button
              variant="secondary"
              className="truncate max-w-[70%]"
              onClick={() => onSpeak(p.text)}
              aria-label={`Speak phrase: ${p.text}`}
            >
              {p.text}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => remove(p.id)} aria-label="Remove phrase">
              ✕
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
