"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

type CibilResponse = {
  current_score: number
  factors: {
    credit_utilization?: number
    payment_history?: string
    credit_age?: number
    credit_mix?: string
    recent_inquiries?: number
  }
  recommendations: string[]
  improvement_potential: number
}

export default function CibilUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CibilResponse | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (!file) {
      setError("Please select a CIBIL PDF file.")
      return
    }
    setLoading(true)
    try {
      const form = new FormData()
      form.set("file", file)
      const res = await fetch("/api/analyze/cibil", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || "CIBIL analysis failed")
      setResult(data)
    } catch (err: any) {
      setError(err.message || "CIBIL analysis failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CIBIL Advisor</CardTitle>
        <CardDescription>Upload your CIBIL PDF for insights.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="cibil">CIBIL PDF</Label>
            <Input id="cibil" type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-xs text-muted-foreground">Only PDF is supported.</p>
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
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Current Score</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{result.current_score}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Utilization</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {result.factors?.credit_utilization ?? "-"}%
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Inquiries</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{result.factors?.recent_inquiries ?? "-"}</CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Factors</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <ul className="grid gap-1">
                    {Object.entries(result.factors || {}).map(([k, v]) => (
                      <li key={k} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{k.replaceAll("_", " ")}</span>
                        <span className="font-medium">{String(v)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed">
                  <ul className="list-disc pl-5">
                    {result.recommendations?.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Improvement Potential</CardTitle>
                <CardDescription>Higher means more headroom to improve.</CardDescription>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{result.improvement_potential}%</CardContent>
            </Card>

            <div className="flex justify-center">
              <Button asChild variant="outline">
                <Link href="/reports?report_type=cibil">View All CIBIL Reports</Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
