import { NextResponse } from "next/server"
import { forwardFormUrlEncoded } from "../../_utils/proxy"

export async function POST(request: Request) {
  try {
    const upstream = await forwardFormUrlEncoded(request, "/search/update-knowledge")
    const status = upstream.status
    const contentType = upstream.headers.get("content-type") || ""

    if (status === 204) return NextResponse.json(null, { status })

    if (contentType.includes("application/json")) {
      try {
        const data = await upstream.json()
        return NextResponse.json(data, { status })
      } catch (err) {
        return NextResponse.json({ detail: "Invalid JSON from upstream" }, { status: 502 })
      }
    }

    const text = await upstream.text()
    if (!text) return NextResponse.json({ detail: "Empty response from upstream" }, { status: 502 })
    try {
      const parsed = JSON.parse(text)
      return NextResponse.json(parsed, { status })
    } catch (err) {
      return NextResponse.json({ detail: "Upstream returned non-JSON response", body: text.slice(0, 200) }, { status: 502 })
    }
  } catch (e: any) {
    return NextResponse.json({ detail: "Upstream error" }, { status: 500 })
  }
}
