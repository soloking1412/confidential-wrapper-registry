import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import type { WrapperPair } from "@/types"

vi.mock("wagmi", () => ({
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
  useAccount: vi.fn(),
  usePublicClient: vi.fn(),
}))

vi.mock("@/lib/sdk", () => ({
  getZamaSDK: vi.fn(),
  resetSDK: vi.fn(),
}))

vi.mock("@/hooks/usePendingUnwraps", () => ({
  usePendingUnwraps: vi.fn(),
}))

import { useWriteContract, useWaitForTransactionReceipt, useAccount, usePublicClient } from "wagmi"
import { getZamaSDK } from "@/lib/sdk"
import { usePendingUnwraps } from "@/hooks/usePendingUnwraps"
import { useUnwrap } from "@/hooks/useUnwrap"

const PAIR: WrapperPair = {
  chainId: 11155111,
  erc20: {
    address: "0xERC20000000000000000000000000000000000000",
    name: "Mock USDC",
    symbol: "USDCMock",
    decimals: 6,
  },
  wrapper: {
    address: "0xWRAPPER00000000000000000000000000000000000",
    name: "cUSDCMock",
    symbol: "cUSDCMock",
    decimals: 6,
  },
  rate: 1n,
  inferredTotalSupply: 0n,
  isValid: true,
  source: "onchain",
}

const MOCK_ADD = vi.fn()
const WRITE_ASYNC = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()

  vi.mocked(useAccount).mockReturnValue({
    address: "0xUser000000000000000000000000000000000000" as `0x${string}`,
    connector: { getProvider: vi.fn().mockResolvedValue({}) },
  } as unknown as ReturnType<typeof useAccount>)

  vi.mocked(useWriteContract).mockReturnValue({
    writeContractAsync: WRITE_ASYNC,
  } as unknown as ReturnType<typeof useWriteContract>)

  vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
    isLoading: false,
  } as ReturnType<typeof useWaitForTransactionReceipt>)

  vi.mocked(usePublicClient).mockReturnValue({
    waitForTransactionReceipt: vi.fn().mockResolvedValue({ logs: [] }),
  } as unknown as ReturnType<typeof usePublicClient>)

  vi.mocked(usePendingUnwraps).mockReturnValue({
    mine: [],
    add: MOCK_ADD,
    update: vi.fn(),
    remove: vi.fn(),
  })
})

describe("useUnwrap — initial state", () => {
  it("starts in idle state", () => {
    const { result } = renderHook(() => useUnwrap(PAIR, ""))
    expect(result.current.state).toBe("idle")
    expect(result.current.error).toBeNull()
    expect(result.current.requestId).toBeUndefined()
  })

  it("is not loading initially", () => {
    const { result } = renderHook(() => useUnwrap(PAIR, ""))
    expect(result.current.isLoading).toBe(false)
  })
})

describe("useUnwrap — initiateUnwrap", () => {
  it("does nothing when no wallet is connected", async () => {
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      connector: undefined,
    } as unknown as ReturnType<typeof useAccount>)

    const { result } = renderHook(() => useUnwrap(PAIR, "100"))

    await act(async () => {
      await result.current.initiateUnwrap()
    })

    expect(getZamaSDK).not.toHaveBeenCalled()
    expect(result.current.state).toBe("idle")
  })

  it("does nothing when amount is 0", async () => {
    const { result } = renderHook(() => useUnwrap(PAIR, "0"))

    await act(async () => {
      await result.current.initiateUnwrap()
    })

    expect(getZamaSDK).not.toHaveBeenCalled()
    expect(result.current.state).toBe("idle")
  })

  it("does nothing when pair is null", async () => {
    const { result } = renderHook(() => useUnwrap(null, "100"))

    await act(async () => {
      await result.current.initiateUnwrap()
    })

    expect(getZamaSDK).not.toHaveBeenCalled()
  })

  it("transitions to encrypting then requesting then pending on success", async () => {
    const TX_HASH = "0xUnwrapTx" as `0x${string}`
    const MOCK_REQUEST_ID = "0xRequestId111" as `0x${string}`

    const mockUnshield = vi.fn().mockResolvedValue(TX_HASH)
    vi.mocked(getZamaSDK).mockResolvedValue({
      createToken: vi.fn().mockReturnValue({ unshield: mockUnshield }),
    } as unknown as Awaited<ReturnType<typeof getZamaSDK>>)

    vi.mocked(usePublicClient).mockReturnValue({
      waitForTransactionReceipt: vi.fn().mockResolvedValue({
        logs: [
          {
            data: "0x0000000000000000000000000000000000000000000000000000000000000001",
            topics: [
              "0x0000000000000000000000000000000000000000000000000000000000000000",
              "0x000000000000000000000000User00000000000000000000000000000000",
              MOCK_REQUEST_ID,
            ],
          },
        ],
      }),
    } as unknown as ReturnType<typeof usePublicClient>)

    const { result } = renderHook(() => useUnwrap(PAIR, "100"))

    await act(async () => {
      await result.current.initiateUnwrap()
    })

    expect(getZamaSDK).toHaveBeenCalled()
    expect(mockUnshield).toHaveBeenCalled()
    expect(result.current.state).toBe("pending")
  })

  it("sets error state when SDK throws", async () => {
    vi.mocked(getZamaSDK).mockResolvedValue({
      createToken: vi.fn().mockReturnValue({
        unshield: vi.fn().mockRejectedValue(new Error("SDK error")),
      }),
    } as unknown as Awaited<ReturnType<typeof getZamaSDK>>)

    const { result } = renderHook(() => useUnwrap(PAIR, "100"))

    await act(async () => {
      await result.current.initiateUnwrap()
    })

    expect(result.current.state).toBe("error")
    expect(result.current.error).toContain("SDK error")
  })

  it("sets 'Transaction rejected' when user rejects the signature", async () => {
    vi.mocked(getZamaSDK).mockResolvedValue({
      createToken: vi.fn().mockReturnValue({
        unshield: vi.fn().mockRejectedValue(new Error("User rejected the request")),
      }),
    } as unknown as Awaited<ReturnType<typeof getZamaSDK>>)

    const { result } = renderHook(() => useUnwrap(PAIR, "100"))

    await act(async () => {
      await result.current.initiateUnwrap()
    })

    expect(result.current.error).toBe("Transaction rejected")
  })
})

describe("useUnwrap — finalizeUnwrap", () => {
  it("calls writeContractAsync with correct args and transitions to success", async () => {
    const FINALIZE_HASH = "0xFinalizeHash" as `0x${string}`
    WRITE_ASYNC.mockResolvedValue(FINALIZE_HASH)

    const REQUEST_ID = "0xReqId" as `0x${string}`
    const CLEAR_AMOUNT = 1_000_000n
    const PROOF = "0xProof" as `0x${string}`

    const { result } = renderHook(() => useUnwrap(PAIR, "1"))

    await act(async () => {
      await result.current.finalizeUnwrap(REQUEST_ID, CLEAR_AMOUNT, PROOF)
    })

    expect(WRITE_ASYNC).toHaveBeenCalledWith(
      expect.objectContaining({
        address: PAIR.wrapper.address,
        functionName: "finalizeUnwrap",
        args: [REQUEST_ID, CLEAR_AMOUNT, PROOF],
      })
    )

    expect(result.current.state).toBe("success")
    expect(result.current.finalizeTxHash).toBe(FINALIZE_HASH)
  })

  it("sets error when finalize transaction is rejected", async () => {
    WRITE_ASYNC.mockRejectedValue(new Error("User rejected the request"))

    const { result } = renderHook(() => useUnwrap(PAIR, "1"))

    await act(async () => {
      await result.current.finalizeUnwrap("0xReq" as `0x${string}`, 1n, "0xProof" as `0x${string}`)
    })

    expect(result.current.state).toBe("error")
    expect(result.current.error).toBe("Transaction rejected")
  })
})

describe("useUnwrap — reset", () => {
  it("returns to idle and clears error", async () => {
    vi.mocked(getZamaSDK).mockResolvedValue({
      createToken: vi.fn().mockReturnValue({
        unshield: vi.fn().mockRejectedValue(new Error("fail")),
      }),
    } as unknown as Awaited<ReturnType<typeof getZamaSDK>>)

    const { result } = renderHook(() => useUnwrap(PAIR, "100"))

    await act(async () => {
      await result.current.initiateUnwrap()
    })

    expect(result.current.state).toBe("error")

    act(() => {
      result.current.reset()
    })

    expect(result.current.state).toBe("idle")
    expect(result.current.error).toBeNull()
    expect(result.current.requestId).toBeUndefined()
  })
})
