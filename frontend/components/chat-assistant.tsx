"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type ChatResponse = {
  answer: string
  sources_used?: number
  confidence?: string
}

export function ChatAssistant() {
  const [question, setQuestion] = React.useState("")
  const [userContext, setUserContext] = React.useState(
    '{"annual_income": 1200000, "current_investments": {"80C": 50000}}',
  )
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<ChatResponse | null>(null)

  const onAsk = async () => {
    setError(null)
    setLoading(true)
    try {
      const body = {
        question,
        user_context: userContext ? JSON.parse(userContext) : {},
      }
      const res = await fetch("/api/chat/query", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || "Chat failed")
      setResult(data)
    } catch (e: any) {
      setError(e.message || "Chat failed (check GROQ key on backend)")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Ask TaxWise AI</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="q">Your question</Label>
            <Textarea
              id="q"
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="How much can I save by switching tax regimes?"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ctx">User context (JSON)</Label>
            <Textarea id="ctx" rows={4} value={userContext} onChange={(e) => setUserContext(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={onAsk}
              disabled={loading || !question.trim()}
              className="bg-primary text-primary-foreground"
            >
              {loading ? "Thinking..." : "Ask"}
            </Button>
            {error && <span className="text-destructive text-sm">{error}</span>}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Answer</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="whitespace-pre-wrap">{result.answer}</div>
            <div className="text-muted-foreground">
              {typeof result.sources_used !== "undefined" && `Sources used: ${result.sources_used}`}{" "}
              {result.confidence && `• Confidence: ${result.confidence}`}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
