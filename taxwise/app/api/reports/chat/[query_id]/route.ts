import { NextResponse } from "next/server"
import { forwardGet } from "../../../_utils/proxy"

export async function GET(request: Request, { params }: { params: { query_id: string } }) {
  try {
    const upstream = await forwardGet(request, `/reports/chat/${params.query_id}`)
    const status = upstream.status
    const contentType = upstream.headers.get("content-type") || ""

    // 204 No Content
    if (status === 204) {
      return NextResponse.json(null, { status })
    }

    // If the upstream claims JSON, parse safely
    if (contentType.includes("application/json")) {
      try {
        const data = await upstream.json()
        return NextResponse.json(data, { status })
      } catch (err) {
        // JSON parse failed despite content-type -> return informative error
        return NextResponse.json({ detail: "Invalid JSON from upstream" }, { status: 502 })
      }
    }

    // Fallback: read as text and try to parse, otherwise return a helpful error
    const text = await upstream.text()
    if (!text) {
      return NextResponse.json({ detail: "Empty response from upstream" }, { status: 502 })
    }

    try {
      const parsed = JSON.parse(text)
      return NextResponse.json(parsed, { status })
    } catch (err) {
      return NextResponse.json({ detail: "Upstream returned non-JSON response", body: text.slice(0, 200) }, { status: 502 })
    }
  } catch (e: any) {
    return NextResponse.json({ detail: "Upstream error", error: String(e) }, { status: 500 })
  }
}