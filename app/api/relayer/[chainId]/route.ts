import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  const { chainId } = await params

  const relayerUrl =
    chainId === "1"
      ? process.env.MAINNET_RELAYER_URL
      : process.env.SEPOLIA_RELAYER_URL

  if (!relayerUrl) {
    return NextResponse.json({ error: "Relayer not configured for this network" }, { status: 503 })
  }

  try {
    const body = await request.json()
    const response = await fetch(relayerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Relayer request failed"
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
