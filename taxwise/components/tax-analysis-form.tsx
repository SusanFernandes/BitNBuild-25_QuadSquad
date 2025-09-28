"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

type TaxResponse = {
  old_regime_tax: number
  new_regime_tax: number
  recommendations: string[]
  deductions_available: Record<string, number>
}

const quickScenarios = [
  { label: "₹8L + 80C ₹1.5L", income: "800000", s80c: "150000" },
  { label: "₹12L + 80C ₹1.5L", income: "1200000", s80c: "150000" },
  { label: "₹15L + Full Deductions", income: "1500000", s80c: "150000", s80d: "25000", s24b: "200000" },
]

export default function TaxAnalysisForm() {
  const [income, setIncome] = useState<string>("1200000")
  const [s80c, setS80c] = useState<string>("50000")
  const [s80d, setS80d] = useState<string>("18000")
  const [s24b, setS24b] = useState<string>("")
  const [s80g, setS80g] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TaxResponse | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setResult(null)
    try {
      const investments: Record<string, number> = {}
      if (s80c) investments["80C"] = Number(s80c)
      if (s80d) investments["80D"] = Number(s80d)
      if (s24b) investments["24b"] = Number(s24b)
      if (s80g) investments["80G"] = Number(s80g)

      const form = new URLSearchParams()
      form.set("annual_income", String(Number(income)))
      if (Object.keys(investments).length > 0) {
        form.set("current_investments", JSON.stringify(investments))
      }

      const res = await fetch("/api/analyze/tax", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || "Tax analysis failed")
      setResult(data)
    } catch (err: any) {
      setError(err.message || "Tax analysis failed")
    } finally {
      setLoading(false)
    }
  }

  const handleQuickScenario = (scenario: typeof quickScenarios[0]) => {
    setIncome(scenario.income)
    setS80c(scenario.s80c || "")
    setS80d(scenario.s80d || "")
    setS24b(scenario.s24b || "")
    setS80g("")
    setResult(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Analysis</CardTitle>
        <CardDescription>Compare Old vs New regime and get recommendations.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {/* Quick Scenarios */}
        <div className="grid gap-2">
          <Label>Quick Scenarios</Label>
          <div className="flex flex-wrap gap-2">
            {quickScenarios.map((scenario, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => handleQuickScenario(scenario)}
              >
                {scenario.label}
              </Badge>
            ))}
          </div>
        </div>

        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="income">Annual Income (₹)</Label>
              <Input id="income" inputMode="numeric" value={income} onChange={(e) => setIncome(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s80c">80C (₹)</Label>
              <Input id="s80c" inputMode="numeric" value={s80c} onChange={(e) => setS80c(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s80d">80D (₹)</Label>
              <Input id="s80d" inputMode="numeric" value={s80d} onChange={(e) => setS80d(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s24b">24b (₹)</Label>
              <Input id="s24b" inputMode="numeric" value={s24b} onChange={(e) => setS24b(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s80g">80G (₹)</Label>
              <Input id="s80g" inputMode="numeric" value={s80g} onChange={(e) => setS80g(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any specifics you'd like considered…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Analyzing…" : "Analyze"}
            </Button>
            {error && (
              <span className="text-destructive text-sm" role="alert">
                {error}
              </span>
            )}
          </div>
        </form>

        {result && (
          <>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Old Regime Tax</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  ₹ {Math.round(result.old_regime_tax).toLocaleString()}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">New Regime Tax</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  ₹ {Math.round(result.new_regime_tax).toLocaleString()}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-pretty leading-relaxed">
                  <ul className="list-disc pl-5">
                    {result.recommendations?.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Deductions Available</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <ul className="grid gap-1">
                    {Object.entries(result.deductions_available || {}).map(([k, v]) => (
                      <li key={k} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-medium">₹ {Math.round(v).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center">
              <Button asChild variant="outline">
                <Link href="/reports?report_type=tax">View All Tax Reports</Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
