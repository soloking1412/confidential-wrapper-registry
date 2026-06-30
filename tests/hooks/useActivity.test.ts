import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useActivity } from "@/hooks/useActivity"

const WALLET = "0xUser000000000000000000000000000000000001" as `0x${string}`
const OTHER = "0xOther00000000000000000000000000000000002" as `0x${string}`
const SEPOLIA = 11155111

beforeEach(() => {
  localStorage.clear()
})

describe("useActivity", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useActivity(WALLET, SEPOLIA))
    expect(result.current.mine).toHaveLength(0)
  })

  it("adds an entry with a generated id and timestamp", () => {
    const { result } = renderHook(() => useActivity(WALLET, SEPOLIA))
    act(() => {
      result.current.add({ type: "wrap", label: "Wrapped 10 USDCMock", chainId: SEPOLIA, walletAddress: WALLET })
    })
    expect(result.current.mine).toHaveLength(1)
    expect(result.current.mine[0].id).toBeTruthy()
    expect(result.current.mine[0].timestamp).toBeGreaterThan(0)
    expect(result.current.mine[0].type).toBe("wrap")
  })

  it("persists to localStorage under zama_activity", () => {
    const { result } = renderHook(() => useActivity(WALLET, SEPOLIA))
    act(() => {
      result.current.add({ type: "faucet", label: "Claimed", chainId: SEPOLIA, walletAddress: WALLET })
    })
    const stored = JSON.parse(localStorage.getItem("zama_activity") ?? "[]")
    expect(stored).toHaveLength(1)
  })

  it("returns newest first", async () => {
    const { result } = renderHook(() => useActivity(WALLET, SEPOLIA))
    act(() => {
      result.current.add({ type: "wrap", label: "first", chainId: SEPOLIA, walletAddress: WALLET })
    })
    await new Promise((r) => setTimeout(r, 5))
    act(() => {
      result.current.add({ type: "unwrap", label: "second", chainId: SEPOLIA, walletAddress: WALLET })
    })
    expect(result.current.mine[0].label).toBe("second")
    expect(result.current.mine[1].label).toBe("first")
  })

  it("filters by wallet and chainId", () => {
    const { result } = renderHook(() => useActivity(WALLET, SEPOLIA))
    act(() => {
      result.current.add({ type: "wrap", label: "mine", chainId: SEPOLIA, walletAddress: WALLET })
      result.current.add({ type: "wrap", label: "other wallet", chainId: SEPOLIA, walletAddress: OTHER })
      result.current.add({ type: "wrap", label: "other chain", chainId: 1, walletAddress: WALLET })
    })
    expect(result.current.mine).toHaveLength(1)
    expect(result.current.mine[0].label).toBe("mine")
  })

  it("clear removes only the current wallet/chain entries", () => {
    const { result } = renderHook(() => useActivity(WALLET, SEPOLIA))
    act(() => {
      result.current.add({ type: "wrap", label: "mine", chainId: SEPOLIA, walletAddress: WALLET })
      result.current.add({ type: "wrap", label: "other", chainId: 1, walletAddress: WALLET })
    })
    act(() => {
      result.current.clear()
    })
    expect(result.current.mine).toHaveLength(0)
    const all = JSON.parse(localStorage.getItem("zama_activity") ?? "[]")
    expect(all).toHaveLength(1)
    expect(all[0].label).toBe("other")
  })
})
