import { NextResponse } from "next/server"
import { forwardGet } from "../../_utils/proxy"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const reportType = url.searchParams.get('report_type')
    const limit = url.searchParams.get('limit') || '10'
    const offset = url.searchParams.get('offset') || '0'

    let path = `/reports/list?limit=${limit}&offset=${offset}`
    if (reportType) {
      path += `&report_type=${reportType}`
    }

    const upstream = await forwardGet(request, path)
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