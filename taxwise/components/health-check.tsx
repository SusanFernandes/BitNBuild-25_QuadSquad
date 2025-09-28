"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type Health = { status: string; timestamp: string }

export default function HealthCheck() {
  const [health, setHealth] = useState<Health | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const check = async () => {
    setError(null)
    setLoading(true)
    setHealth(null)
    try {
      const res = await fetch("/api/health", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || "Health check failed")
      setHealth(data)
    } catch (err: any) {
      setError(err.message || "Health check failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Check</CardTitle>
        <CardDescription>Verify the backend is reachable.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex gap-3">
          <Button onClick={check} disabled={loading}>
            {loading ? "Checking…" : "Check"}
          </Button>
          {error && (
            <span className="text-destructive text-sm" role="alert">
              {error}
            </span>
          )}
        </div>
        {health && (
          <div className="text-sm">
            <p>
              <span className="text-muted-foreground">Status:</span>{" "}
              <span className="font-medium">{health.status}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Timestamp:</span> {new Date(health.timestamp).toLocaleString()}
            </p>
          </div>
        )}

        <div className="flex justify-center">
          <Button asChild variant="outline" size="sm">
            <Link href="/knowledge">Update Knowledge Base</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
