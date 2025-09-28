import { NextResponse } from "next/server"
import { forwardFormUrlEncoded } from "../../_utils/proxy"

export async function POST(request: Request) {
  try {
    const upstream = await forwardFormUrlEncoded(request, "/analyze/tax")
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (e: any) {
    return NextResponse.json({ detail: "Upstream error" }, { status: 500 })
  }
}
