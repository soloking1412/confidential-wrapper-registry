import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import type { WrapperPair } from "@/types"

vi.mock("wagmi", () => ({
  useReadContract: vi.fn(),
  useReadContracts: vi.fn(),
  useChainId: vi.fn(),
}))

vi.mock("@/config/customPairs", () => ({
  CUSTOM_PAIRS: [],
}))

import { useReadContract, useReadContracts, useChainId } from "wagmi"
import { useRegistryPairs } from "@/hooks/useRegistryPairs"

const MOCK_REGISTRY_PAIRS = [
  {
    tokenAddress: "0xERC20_A" as `0x${string}`,
    confidentialTokenAddress: "0xWRAPPER_A" as `0x${string}`,
    isValid: true,
  },
  {
    tokenAddress: "0xERC20_B" as `0x${string}`,
    confidentialTokenAddress: "0xWRAPPER_B" as `0x${string}`,
    isValid: false,
  },
]

const MOCK_METADATA_RESULTS = [
  { result: "Token A", status: "success" },
  { result: "TKNA", status: "success" },
  { result: 18, status: "success" },
  { result: "Confidential Token A", status: "success" },
  { result: "cTKNA", status: "success" },
  { result: 6, status: "success" },
  { result: 1_000_000_000_000n, status: "success" },
  { result: 500_000n, status: "success" },
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useChainId).mockReturnValue(11155111)
})

describe("useRegistryPairs", () => {
  it("returns isSupported false when chainId has no registry", () => {
    vi.mocked(useChainId).mockReturnValue(137)
    vi.mocked(useReadContract).mockReturnValue({ data: undefined, isLoading: false } as ReturnType<typeof useReadContract>)
    vi.mocked(useReadContracts).mockReturnValue({ data: undefined, isLoading: false } as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useRegistryPairs())
    expect(result.current.isSupported).toBe(false)
  })

  it("returns isSupported true for Sepolia", () => {
    vi.mocked(useReadContract).mockReturnValue({ data: undefined, isLoading: false } as ReturnType<typeof useReadContract>)
    vi.mocked(useReadContracts).mockReturnValue({ data: undefined, isLoading: false } as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useRegistryPairs())
    expect(result.current.isSupported).toBe(true)
  })

  it("returns isSupported true for Mainnet (chainId 1)", () => {
    vi.mocked(useChainId).mockReturnValue(1)
    vi.mocked(useReadContract).mockReturnValue({ data: undefined, isLoading: false } as ReturnType<typeof useReadContract>)
    vi.mocked(useReadContracts).mockReturnValue({ data: undefined, isLoading: false } as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useRegistryPairs())
    expect(result.current.isSupported).toBe(true)
  })

  it("filters out isValid false pairs from registry", async () => {
    vi.mocked(useReadContract).mockReturnValue({
      data: MOCK_REGISTRY_PAIRS,
      isLoading: false,
    } as unknown as ReturnType<typeof useReadContract>)

    vi.mocked(useReadContracts).mockReturnValue({
      data: MOCK_METADATA_RESULTS,
      isLoading: false,
    } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useRegistryPairs())

    await waitFor(() => {
      expect(result.current.pairs).toHaveLength(1)
    })

    expect(result.current.pairs[0].wrapper.address).toBe("0xWRAPPER_A")
  })

  it("maps metadata results to pair fields correctly", async () => {
    vi.mocked(useReadContract).mockReturnValue({
      data: [MOCK_REGISTRY_PAIRS[0]],
      isLoading: false,
    } as unknown as ReturnType<typeof useReadContract>)

    vi.mocked(useReadContracts).mockReturnValue({
      data: MOCK_METADATA_RESULTS,
      isLoading: false,
    } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useRegistryPairs())

    await waitFor(() => {
      expect(result.current.pairs).toHaveLength(1)
    })

    const pair = result.current.pairs[0]
    expect(pair.erc20.name).toBe("Token A")
    expect(pair.erc20.symbol).toBe("TKNA")
    expect(pair.erc20.decimals).toBe(18)
    expect(pair.wrapper.name).toBe("Confidential Token A")
    expect(pair.wrapper.symbol).toBe("cTKNA")
    expect(pair.wrapper.decimals).toBe(6)
    expect(pair.rate).toBe(1_000_000_000_000n)
    expect(pair.inferredTotalSupply).toBe(500_000n)
  })

  it("tags onchain pairs with source: 'onchain'", async () => {
    vi.mocked(useReadContract).mockReturnValue({
      data: [MOCK_REGISTRY_PAIRS[0]],
      isLoading: false,
    } as unknown as ReturnType<typeof useReadContract>)

    vi.mocked(useReadContracts).mockReturnValue({
      data: MOCK_METADATA_RESULTS,
      isLoading: false,
    } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useRegistryPairs())

    await waitFor(() => {
      expect(result.current.pairs.length).toBeGreaterThan(0)
    })

    expect(result.current.pairs[0].source).toBe("onchain")
  })

  it("returns empty pairs while loading", () => {
    vi.mocked(useReadContract).mockReturnValue({ data: undefined, isLoading: true } as ReturnType<typeof useReadContract>)
    vi.mocked(useReadContracts).mockReturnValue({ data: undefined, isLoading: true } as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useRegistryPairs())
    expect(result.current.pairs).toHaveLength(0)
    expect(result.current.isLoading).toBe(true)
  })

  it("uses fallback values when metadata calls fail", async () => {
    const partialMetadata = [
      { result: undefined, status: "failure" },
      { result: undefined, status: "failure" },
      { result: undefined, status: "failure" },
      { result: undefined, status: "failure" },
      { result: undefined, status: "failure" },
      { result: undefined, status: "failure" },
      { result: undefined, status: "failure" },
      { result: undefined, status: "failure" },
    ]

    vi.mocked(useReadContract).mockReturnValue({
      data: [MOCK_REGISTRY_PAIRS[0]],
      isLoading: false,
    } as unknown as ReturnType<typeof useReadContract>)

    vi.mocked(useReadContracts).mockReturnValue({
      data: partialMetadata,
      isLoading: false,
    } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useRegistryPairs())

    await waitFor(() => {
      expect(result.current.pairs).toHaveLength(1)
    })

    const pair = result.current.pairs[0]
    expect(pair.erc20.name).toBe("Unknown")
    expect(pair.erc20.symbol).toBe("???")
    expect(pair.erc20.decimals).toBe(18)
    expect(pair.wrapper.decimals).toBe(6)
    expect(pair.rate).toBe(0n)
  })
})
