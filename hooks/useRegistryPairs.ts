"use client"

import { useReadContract, useReadContracts } from "wagmi"
import { useMemo } from "react"
import { useChainId } from "wagmi"
import { WrappersRegistryABI, ERC7984WrapperABI, ERC20ABI } from "@/lib/contracts/abis"
import { REGISTRY_ADDRESSES } from "@/lib/contracts/addresses"
import { CUSTOM_PAIRS } from "@/config/customPairs"
import { mergeWithCustom } from "@/lib/registry/merge"
import { useCustomPairs } from "@/hooks/useCustomPairs"
import type { WrapperPair } from "@/types"

export function useRegistryPairs() {
  const chainId = useChainId()
  const registryAddress = REGISTRY_ADDRESSES[chainId]
  const { pairs: userPairs } = useCustomPairs(chainId)

  const { data: rawPairs, isLoading: pairsLoading, error: pairsError } = useReadContract({
    address: registryAddress,
    abi: WrappersRegistryABI,
    functionName: "getTokenConfidentialTokenPairs",
    query: { enabled: !!registryAddress },
  })

  const validPairs = useMemo(
    () => (rawPairs ?? []).filter((p) => p.isValid),
    [rawPairs]
  )

  const metadataCalls = useMemo(() => {
    if (!validPairs.length) return []
    return validPairs.flatMap((pair) => [
      { address: pair.tokenAddress, abi: ERC20ABI, functionName: "name" as const },
      { address: pair.tokenAddress, abi: ERC20ABI, functionName: "symbol" as const },
      { address: pair.tokenAddress, abi: ERC20ABI, functionName: "decimals" as const },
      { address: pair.confidentialTokenAddress, abi: ERC7984WrapperABI, functionName: "name" as const },
      { address: pair.confidentialTokenAddress, abi: ERC7984WrapperABI, functionName: "symbol" as const },
      { address: pair.confidentialTokenAddress, abi: ERC7984WrapperABI, functionName: "decimals" as const },
      { address: pair.confidentialTokenAddress, abi: ERC7984WrapperABI, functionName: "rate" as const },
      { address: pair.confidentialTokenAddress, abi: ERC7984WrapperABI, functionName: "inferredTotalSupply" as const },
    ])
  }, [validPairs])

  const { data: metadataResults, isLoading: metaLoading } = useReadContracts({
    contracts: metadataCalls,
    query: { enabled: metadataCalls.length > 0 },
  })

  const pairs = useMemo<WrapperPair[]>(() => {
    if (!validPairs.length || !metadataResults) {
      return mergeWithCustom([], CUSTOM_PAIRS, chainId).concat(userPairs)
    }

    const result: WrapperPair[] = []
    for (let i = 0; i < validPairs.length; i++) {
      const base = i * 8
      const get = (idx: number) => metadataResults[base + idx]?.result

      result.push({
        chainId,
        erc20: {
          address: validPairs[i].tokenAddress,
          name: (get(0) as string) ?? "Unknown",
          symbol: (get(1) as string) ?? "???",
          decimals: (get(2) as number) ?? 18,
        },
        wrapper: {
          address: validPairs[i].confidentialTokenAddress,
          name: (get(3) as string) ?? "Unknown",
          symbol: (get(4) as string) ?? "???",
          decimals: (get(5) as number) ?? 6,
        },
        rate: (get(6) as bigint) ?? 0n,
        inferredTotalSupply: (get(7) as bigint) ?? 0n,
        isValid: true,
        source: "onchain",
      })
    }

    const merged = mergeWithCustom(result, CUSTOM_PAIRS, chainId)
    const seen = new Set(merged.map((p) => p.wrapper.address.toLowerCase()))
    const extra = userPairs.filter((p) => !seen.has(p.wrapper.address.toLowerCase()))
    return [...merged, ...extra]
  }, [validPairs, metadataResults, chainId, userPairs])

  return {
    pairs,
    isLoading: pairsLoading || metaLoading,
    error: pairsError,
    isSupported: !!registryAddress,
  }
}
