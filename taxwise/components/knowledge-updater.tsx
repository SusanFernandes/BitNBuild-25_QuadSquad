"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

type Resp = { message?: string }

const suggestedQueries = [
  "latest income tax rates India 2024",
  "CIBIL score improvement tips",
  "tax deduction limits 2024-25",
  "home loan interest deduction rules"
]

export default function KnowledgeUpdater() {
  const [query, setQuery] = useState("latest income tax rates India 2024")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!query.trim()) {
      setError("Please enter a query.")
      return
    }
    setLoading(true)
    try {
      const form = new URLSearchParams()
      form.set("query", query)
      const res = await fetch("/api/search/update-knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      })

      if (res.status === 204) throw new Error("No content returned from server")

      const contentType = (res.headers.get("content-type") || "").toLowerCase()
      let data: Resp | null = null

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

      if (!res.ok) throw new Error((data as any)?.detail || "Update failed")
      setMessage((data as any)?.message || "Updated knowledge base.")
    } catch (err: any) {
      setError(err.message || "Update failed")
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestedQuery = (suggestedQuery: string) => {
    setQuery(suggestedQuery)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Knowledge Base</CardTitle>
        <CardDescription>Fetch latest finance info and update AI memory.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label>Suggested Queries</Label>
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map((suggestedQuery, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestedQuery(suggestedQuery)}
              >
                {suggestedQuery}
              </Button>
            ))}
          </div>
        </div>

        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="query">Query</Label>
            <Input id="query" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Updating…" : "Update"}
            </Button>
            {error && (
              <span className="text-destructive text-sm" role="alert">
                {error}
              </span>
            )}
            {message && <span className="text-sm text-green-600">{message}</span>}
          </div>
        </form>

        <div className="flex justify-center">
          <Button asChild variant="outline" size="sm">
            <Link href="/health">Check API Health</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
