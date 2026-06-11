"use client"

import { useState, useCallback } from "react"
import { useWriteContract, useWaitForTransactionReceipt, useAccount, usePublicClient } from "wagmi"
import { parseUnits, decodeEventLog } from "viem"
import { ERC7984WrapperABI } from "@/lib/contracts/abis"
import { getZamaSDK } from "@/lib/sdk"
import { usePendingUnwraps } from "./usePendingUnwraps"
import type { WrapperPair } from "@/types"

export type UnwrapState =
  | "idle"
  | "encrypting"
  | "requesting"
  | "pending"
  | "finalizing"
  | "success"
  | "error"

export function useUnwrap(pair: WrapperPair | null, rawAmount: string) {
  const { address, connector } = useAccount()
  const publicClient = usePublicClient()
  const [state, setState] = useState<UnwrapState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [requestId, setRequestId] = useState<`0x${string}` | undefined>()
  const [finalizeTxHash, setFinalizeTxHash] = useState<`0x${string}` | undefined>()

  const { add } = usePendingUnwraps(address, pair?.chainId)
  const { writeContractAsync } = useWriteContract()
  const { isLoading: finalizeConfirming } = useWaitForTransactionReceipt({ hash: finalizeTxHash })

  const decimals = pair?.wrapper.decimals ?? 6
  const amount = (() => {
    try {
      return rawAmount ? parseUnits(rawAmount, decimals) : 0n
    } catch {
      return 0n
    }
  })()

  const initiateUnwrap = useCallback(async () => {
    if (!pair || !address || amount === 0n || !publicClient) return
    setError(null)

    try {
      setState("encrypting")

      const walletClient = await connector?.getProvider?.()
      if (!walletClient) throw new Error("Wallet client unavailable")

      const sdk = await getZamaSDK(walletClient as never, publicClient as never, pair.chainId)
      const token = (sdk as { createToken: (a: string) => { unshield: (n: bigint) => Promise<`0x${string}`> } }).createToken(pair.wrapper.address)

      setState("requesting")
      const txHash = await token.unshield(amount)

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      const unwrapLog = receipt.logs.find((log) => {
        try {
          const decoded = decodeEventLog({
            abi: ERC7984WrapperABI,
            data: log.data,
            topics: log.topics,
          })
          return decoded.eventName === "UnwrapRequested"
        } catch {
          return false
        }
      })

      if (unwrapLog) {
        const decoded = decodeEventLog({
          abi: ERC7984WrapperABI,
          data: unwrapLog.data,
          topics: unwrapLog.topics,
        }) as { args: { unwrapRequestId: `0x${string}` } }

        const id = decoded.args.unwrapRequestId
        setRequestId(id)
        add({
          requestId: id,
          wrapperAddress: pair.wrapper.address,
          chainId: pair.chainId,
          walletAddress: address,
          timestamp: Date.now(),
          status: "pending",
        })
      }

      setState("pending")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed"
      setError(msg.includes("User rejected") ? "Transaction rejected" : msg.slice(0, 120))
      setState("error")
    }
  }, [pair, address, amount, publicClient, connector, add])

  const finalizeUnwrap = useCallback(
    async (id: `0x${string}`, clearAmount: bigint, proof: `0x${string}`) => {
      if (!pair) return
      setError(null)

      try {
        setState("finalizing")
        const hash = await writeContractAsync({
          address: pair.wrapper.address,
          abi: ERC7984WrapperABI,
          functionName: "finalizeUnwrap",
          args: [id, clearAmount, proof],
        })
        setFinalizeTxHash(hash)
        setState("success")
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Finalize failed"
        setError(msg.includes("User rejected") ? "Transaction rejected" : msg.slice(0, 120))
        setState("error")
      }
    },
    [pair, writeContractAsync]
  )

  const reset = useCallback(() => {
    setState("idle")
    setError(null)
    setRequestId(undefined)
    setFinalizeTxHash(undefined)
  }, [])

  return {
    state,
    error,
    requestId,
    finalizeTxHash,
    isLoading: finalizeConfirming || state === "encrypting" || state === "requesting",
    initiateUnwrap,
    finalizeUnwrap,
    reset,
  }
}
