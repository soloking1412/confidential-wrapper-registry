import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useCustomPairs } from "@/hooks/useCustomPairs"
import type { StoredCustomPair } from "@/types"

const SEPOLIA = 11155111

function makePair(overrides?: Partial<StoredCustomPair>): StoredCustomPair {
  return {
    chainId: SEPOLIA,
    erc20: { address: "0xERC20000000000000000000000000000000000001", name: "Mock", symbol: "MTK", decimals: 18 },
    wrapper: { address: "0xWRAPPER0000000000000000000000000000000001", name: "cMock", symbol: "cMTK", decimals: 6 },
    rate: "1000000000000",
    addedAt: Date.now(),
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe("useCustomPairs", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useCustomPairs(SEPOLIA))
    expect(result.current.pairs).toHaveLength(0)
  })

  it("adds a pair and exposes it as a WrapperPair with a bigint rate and custom source", () => {
    const { result } = renderHook(() => useCustomPairs(SEPOLIA))
    act(() => {
      result.current.add(makePair())
    })

    expect(result.current.pairs).toHaveLength(1)
    const p = result.current.pairs[0]
    expect(p.rate).toBe(1000000000000n)
    expect(p.source).toBe("custom")
    expect(p.wrapper.symbol).toBe("cMTK")
  })

  it("persists to localStorage under zama_custom_pairs", () => {
    const { result } = renderHook(() => useCustomPairs(SEPOLIA))
    act(() => {
      result.current.add(makePair())
    })

    const stored = JSON.parse(localStorage.getItem("zama_custom_pairs") ?? "[]")
    expect(stored).toHaveLength(1)
    expect(stored[0].rate).toBe("1000000000000")
  })

  it("filters by chainId", () => {
    const { result } = renderHook(() => useCustomPairs(SEPOLIA))
    act(() => {
      result.current.add(makePair())
      result.current.add(
        makePair({ chainId: 1, wrapper: { address: "0xWRAP2", name: "c2", symbol: "c2", decimals: 6 } })
      )
    })
    expect(result.current.pairs).toHaveLength(1)
    expect(result.current.pairs[0].chainId).toBe(SEPOLIA)
  })

  it("dedupes: re-adding the same wrapper on the same chain replaces it", () => {
    const { result } = renderHook(() => useCustomPairs(SEPOLIA))
    act(() => {
      result.current.add(makePair({ rate: "1" }))
      result.current.add(makePair({ rate: "5" }))
    })
    expect(result.current.pairs).toHaveLength(1)
    expect(result.current.pairs[0].rate).toBe(5n)
  })

  it("removes a pair by wrapper address and chainId", () => {
    const { result } = renderHook(() => useCustomPairs(SEPOLIA))
    act(() => {
      result.current.add(makePair())
    })
    expect(result.current.pairs).toHaveLength(1)

    act(() => {
      result.current.remove("0xWRAPPER0000000000000000000000000000000001", SEPOLIA)
    })
    expect(result.current.pairs).toHaveLength(0)
  })
})
