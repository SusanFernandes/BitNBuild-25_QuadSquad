"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ChatResponse = {
  answer: string
  sources_used?: number
  confidence?: string
}

export default function ChatAdvisor() {
  const [question, setQuestion] = useState<string>("How much can I save by switching tax regimes?")
  const [useContext, setUseContext] = useState<boolean>(false)

  // Context fields
  const [annualIncome, setAnnualIncome] = useState<string>("1200000")
  const [age, setAge] = useState<string>("30")
  const [city, setCity] = useState<string>("Mumbai")
  const [s80c, setS80c] = useState<string>("50000")
  const [s80d, setS80d] = useState<string>("18000")
  const [cibil, setCibil] = useState<string>("750")
  const [util, setUtil] = useState<string>("25")
  const [emi, setEmi] = useState<string>("35000")
  const [outstanding, setOutstanding] = useState<string>("2500000")
  const [risk, setRisk] = useState<string>("moderate")
  const [dependents, setDependents] = useState<string>("2")
  const [nri, setNri] = useState<boolean>(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [answer, setAnswer] = useState<ChatResponse | null>(null)

  const onAsk = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setAnswer(null)
    if (!question.trim()) {
      setError("Please enter a question.")
      return
    }
    setLoading(true)
    try {
      const userContext: Record<string, any> = {}
      if (useContext) {
        if (annualIncome) userContext.annual_income = Number(annualIncome)
        if (age) userContext.age = Number(age)
        if (city) userContext.city = city
        const current_investments: Record<string, number> = {}
        if (s80c) current_investments["80C"] = Number(s80c)
        if (s80d) current_investments["80D"] = Number(s80d)
        if (Object.keys(current_investments).length) userContext.current_investments = current_investments
        if (cibil) userContext.cibil_score = Number(cibil)
        if (util) userContext.credit_utilization = Number(util)
        if (emi) userContext.home_loan_emi = Number(emi)
        if (outstanding) userContext.outstanding_loan = Number(outstanding)
        if (risk) userContext.risk_profile = risk
        if (dependents) userContext.dependents = Number(dependents)
        userContext.nri_status = nri
      }

      const res = await fetch("/api/chat/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          user_context: userContext,
        }),
      })
      if (res.status === 204) throw new Error("No content returned from server")

      const contentType = (res.headers.get("content-type") || "").toLowerCase()
      let data: any = null

      if (contentType.includes("application/json")) {
        try {
          data = await res.json()
        } catch (e) {
          throw new Error("Invalid JSON received from server")
        }
      } else {
        const text = await res.text()
        try {
          data = text ? JSON.parse(text) : null
        } catch (e) {
          throw new Error(`Unexpected response from server: ${text?.slice(0,200)}`)
        }
      }

      if (!res.ok) throw new Error(data?.detail || "Chat failed")
      setAnswer(data)
    } catch (err: any) {
      setError(err.message || "Chat failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ask the AI Advisor</CardTitle>
        <CardDescription>Personalized financial guidance powered by your backend AI.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={onAsk} className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="question">Your Question</Label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Should I prepay home loan or invest in mutual funds?"
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch id="useContext" checked={useContext} onCheckedChange={setUseContext} />
            <Label htmlFor="useContext">Provide personal context</Label>
          </div>

          {useContext && (
            <div className="grid gap-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="grid gap-1">
                  <Label htmlFor="annualIncome">Annual Income (₹)</Label>
                  <Input
                    id="annualIncome"
                    inputMode="numeric"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-4">
                <div className="grid gap-1">
                  <Label htmlFor="s80c">80C (₹)</Label>
                  <Input id="s80c" inputMode="numeric" value={s80c} onChange={(e) => setS80c(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="s80d">80D (₹)</Label>
                  <Input id="s80d" inputMode="numeric" value={s80d} onChange={(e) => setS80d(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="cibil">CIBIL</Label>
                  <Input id="cibil" inputMode="numeric" value={cibil} onChange={(e) => setCibil(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="util">Utilization %</Label>
                  <Input id="util" inputMode="numeric" value={util} onChange={(e) => setUtil(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-4">
                <div className="grid gap-1">
                  <Label htmlFor="emi">Home Loan EMI (₹)</Label>
                  <Input id="emi" inputMode="numeric" value={emi} onChange={(e) => setEmi(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="outstanding">Outstanding Loan (₹)</Label>
                  <Input
                    id="outstanding"
                    inputMode="numeric"
                    value={outstanding}
                    onChange={(e) => setOutstanding(e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <Label>Risk Profile</Label>
                  <Select value={risk} onValueChange={setRisk}>
                    <SelectTrigger aria-label="Risk Profile">
                      <SelectValue placeholder="Select risk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="dependents">Dependents</Label>
                  <Input
                    id="dependents"
                    inputMode="numeric"
                    value={dependents}
                    onChange={(e) => setDependents(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch id="nri" checked={nri} onCheckedChange={setNri} />
                <Label htmlFor="nri">NRI Status</Label>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Asking…" : "Ask"}
            </Button>
            {error && (
              <span className="text-destructive text-sm" role="alert">
                {error}
              </span>
            )}
          </div>
        </form>

        {answer && (
          <>
            <Separator />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Answer</CardTitle>
                <CardDescription>
                  Sources used: {answer.sources_used ?? "-"} | Confidence: {answer.confidence ?? "-"}
                </CardDescription>
              </CardHeader>
              <CardContent className="leading-relaxed whitespace-pre-wrap">{answer.answer}</CardContent>
            </Card>
            <p className="text-xs text-muted-foreground">
              Tip: Ensure GROQ_API_KEY is configured on your backend for AI chat.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
