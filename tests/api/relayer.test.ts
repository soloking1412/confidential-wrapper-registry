import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "@/app/api/relayer/[chainId]/route"

const SEPOLIA_URL = "https://relayer.sepolia.example.com"
const MAINNET_URL = "https://relayer.mainnet.example.com"

beforeEach(() => {
  vi.stubEnv("SEPOLIA_RELAYER_URL", SEPOLIA_URL)
  vi.stubEnv("MAINNET_RELAYER_URL", MAINNET_URL)
  vi.restoreAllMocks()
})

function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/relayer/11155111", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/relayer/[chainId]", () => {
  it("returns 503 when SEPOLIA_RELAYER_URL is not set", async () => {
    vi.stubEnv("SEPOLIA_RELAYER_URL", "")

    const req = makeRequest({ action: "test" })
    const res = await POST(req, { params: Promise.resolve({ chainId: "11155111" }) })

    expect(res.status).toBe(503)
    const json = await res.json()
    expect(json.error).toMatch(/not configured/)
  })

  it("returns 503 when MAINNET_RELAYER_URL is not set", async () => {
    vi.stubEnv("MAINNET_RELAYER_URL", "")

    const req = makeRequest({ action: "test" })
    const res = await POST(req, { params: Promise.resolve({ chainId: "1" }) })

    expect(res.status).toBe(503)
  })

  it("proxies to SEPOLIA_RELAYER_URL for chainId 11155111", async () => {
    const mockResponseBody = { result: "ok" }
    const mockFetch = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockResponseBody), { status: 200 })
    )

    const req = makeRequest({ payload: "data" })
    const res = await POST(req, { params: Promise.resolve({ chainId: "11155111" }) })

    expect(mockFetch).toHaveBeenCalledWith(
      SEPOLIA_URL,
      expect.objectContaining({ method: "POST" })
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual(mockResponseBody)
  })

  it("proxies to MAINNET_RELAYER_URL for chainId 1", async () => {
    const mockFetch = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ result: "mainnet" }), { status: 200 })
    )

    const req = makeRequest({ payload: "data" })
    const res = await POST(req, { params: Promise.resolve({ chainId: "1" }) })

    expect(mockFetch).toHaveBeenCalledWith(
      MAINNET_URL,
      expect.objectContaining({ method: "POST" })
    )
    expect(res.status).toBe(200)
  })

  it("also uses SEPOLIA_RELAYER_URL for unknown chain IDs (non-mainnet)", async () => {
    const mockFetch = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    )

    const req = makeRequest({})
    await POST(req, { params: Promise.resolve({ chainId: "5" }) })

    expect(mockFetch).toHaveBeenCalledWith(SEPOLIA_URL, expect.anything())
  })

  it("forwards the request body as JSON to the relayer", async () => {
    const payload = { method: "eth_call", id: 42 }
    const mockFetch = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: 42 }), { status: 200 })
    )

    await POST(makeRequest(payload), { params: Promise.resolve({ chainId: "11155111" }) })

    const fetchCall = mockFetch.mock.calls[0]
    const sentBody = JSON.parse(fetchCall[1]?.body as string)
    expect(sentBody).toEqual(payload)
  })

  it("returns 502 when the relayer fetch throws a network error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"))

    const req = makeRequest({ action: "test" })
    const res = await POST(req, { params: Promise.resolve({ chainId: "11155111" }) })

    expect(res.status).toBe(502)
    const json = await res.json()
    expect(json.error).toContain("Network error")
  })

  it("forwards a non-200 status from the relayer back to the client", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Bad input" }), { status: 400 })
    )

    const req = makeRequest({})
    const res = await POST(req, { params: Promise.resolve({ chainId: "11155111" }) })

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe("Bad input")
  })

  it("sets Content-Type: application/json on the upstream request", async () => {
    const mockFetch = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    )

    await POST(makeRequest({}), { params: Promise.resolve({ chainId: "11155111" }) })

    const headers = mockFetch.mock.calls[0][1]?.headers as Record<string, string>
    expect(headers["Content-Type"]).toBe("application/json")
  })
})
