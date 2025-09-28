"use client"

import type React from "react"

import { useState, useRef } from "react"
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
  const inputRef = useRef<HTMLInputElement | null>(null)

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
      const text = await res.text()
      let data: any = null
      try {
        data = JSON.parse(text)
      } catch (err) {
        data = null
      }

      if (!res.ok) {
        throw new Error((data && data.detail) || `CIBIL analysis failed (status ${res.status})`)
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || "CIBIL analysis failed")
    } finally {
      setLoading(false)
    }
  }

  const openPicker = () => inputRef.current?.click()
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length) setFile(e.dataTransfer.files[0])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CIBIL Advisor</CardTitle>
        <CardDescription>Upload your CIBIL PDF for insights.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={onSubmit} className="grid gap-3">
          <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop} onClick={openPicker} className="rounded-lg border-2 border-dashed p-6 text-center cursor-pointer hover:scale-[1.01] transition-transform">
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <div className="font-medium">Upload CIBIL PDF</div>
            <div className="text-sm text-muted-foreground">Drag & drop or click to select</div>
            {file && <div className="mt-2 text-sm">{file.name} • {(file.size / 1024).toFixed(0)} KB</div>}
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={loading}>{loading ? "Analyzing…" : "Analyze"}</Button>
            <Button type="button" variant="ghost" onClick={() => setFile(null)}>Clear</Button>
            {error && <div className="text-destructive text-sm">{error}</div>}
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
