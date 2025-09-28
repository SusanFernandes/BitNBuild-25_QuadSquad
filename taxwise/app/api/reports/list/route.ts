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
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (e: any) {
    return NextResponse.json({ detail: "Upstream error" }, { status: 500 })
  }
}