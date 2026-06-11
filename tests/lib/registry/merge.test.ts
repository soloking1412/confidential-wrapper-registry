import { describe, it, expect } from "vitest"
import { mergeWithCustom } from "@/lib/registry/merge"
import type { WrapperPair, CustomPair } from "@/types"

const CHAIN_ID = 11155111

function makePair(wrapperAddr: string, erc20Addr: string): WrapperPair {
  return {
    chainId: CHAIN_ID,
    erc20: { address: erc20Addr as `0x${string}`, name: "Token", symbol: "TKN", decimals: 18 },
    wrapper: { address: wrapperAddr as `0x${string}`, name: "cToken", symbol: "cTKN", decimals: 6 },
    rate: 1_000_000_000_000n,
    inferredTotalSupply: 0n,
    isValid: true,
    source: "onchain",
  }
}

function makeCustomPair(wrapperAddr: string, erc20Addr: string, chainId = CHAIN_ID): CustomPair {
  return {
    chainId,
    erc20: { address: erc20Addr, name: "Custom Token", symbol: "CTK", decimals: 18 },
    wrapper: { address: wrapperAddr, name: "cCustom", symbol: "cCTK", decimals: 6 },
  }
}

describe("mergeWithCustom", () => {
  it("returns onchain pairs unchanged when no custom pairs exist", () => {
    const onchain = [makePair("0xAAA", "0xBBB")]
    const result = mergeWithCustom(onchain, [], CHAIN_ID)
    expect(result).toHaveLength(1)
    expect(result[0].source).toBe("onchain")
  })

  it("appends non-conflicting custom pairs", () => {
    const onchain = [makePair("0xAAA", "0xBBB")]
    const custom = [makeCustomPair("0xCCC", "0xDDD")]
    const result = mergeWithCustom(onchain, custom, CHAIN_ID)
    expect(result).toHaveLength(2)
    expect(result[1].source).toBe("custom")
    expect(result[1].wrapper.address).toBe("0xCCC")
  })

  it("onchain wins when wrapper addresses collide (case-insensitive)", () => {
    const onchain = [makePair("0xaaa", "0xBBB")]
    const custom = [makeCustomPair("0xAAA", "0xDDD")]
    const result = mergeWithCustom(onchain, custom, CHAIN_ID)
    expect(result).toHaveLength(1)
    expect(result[0].source).toBe("onchain")
  })

  it("filters custom pairs to the matching chainId", () => {
    const onchain: WrapperPair[] = []
    const custom = [
      makeCustomPair("0xCCC", "0xDDD", 1),
      makeCustomPair("0xEEE", "0xFFF", CHAIN_ID),
    ]
    const result = mergeWithCustom(onchain, custom, CHAIN_ID)
    expect(result).toHaveLength(1)
    expect(result[0].wrapper.address).toBe("0xEEE")
  })

  it("tags custom pairs with source: 'custom'", () => {
    const result = mergeWithCustom([], [makeCustomPair("0xCCC", "0xDDD")], CHAIN_ID)
    expect(result[0].source).toBe("custom")
  })

  it("initialises custom pair rate and inferredTotalSupply to 0n", () => {
    const result = mergeWithCustom([], [makeCustomPair("0xCCC", "0xDDD")], CHAIN_ID)
    expect(result[0].rate).toBe(0n)
    expect(result[0].inferredTotalSupply).toBe(0n)
  })

  it("handles empty inputs", () => {
    expect(mergeWithCustom([], [], CHAIN_ID)).toHaveLength(0)
  })

  it("preserves order: onchain first, custom appended", () => {
    const onchain = [makePair("0xAAA", "0xBBB"), makePair("0xCCC", "0xDDD")]
    const custom = [makeCustomPair("0xEEE", "0xFFF")]
    const result = mergeWithCustom(onchain, custom, CHAIN_ID)
    expect(result[0].wrapper.address).toBe("0xAAA")
    expect(result[1].wrapper.address).toBe("0xCCC")
    expect(result[2].wrapper.address).toBe("0xEEE")
  })
})
