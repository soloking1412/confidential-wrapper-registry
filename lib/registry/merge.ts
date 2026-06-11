import type { WrapperPair, CustomPair, TokenMetadata } from "@/types"

export function mergeWithCustom(
  onchainPairs: WrapperPair[],
  customPairs: CustomPair[],
  chainId: number
): WrapperPair[] {
  const seen = new Set(onchainPairs.map((p) => p.wrapper.address.toLowerCase()))

  const custom: WrapperPair[] = customPairs
    .filter((cp) => cp.chainId === chainId)
    .filter((cp) => !seen.has(cp.wrapper.address.toLowerCase()))
    .map((cp) => ({
      chainId,
      erc20: {
        address: cp.erc20.address as `0x${string}`,
        name: cp.erc20.name,
        symbol: cp.erc20.symbol,
        decimals: cp.erc20.decimals,
      },
      wrapper: {
        address: cp.wrapper.address as `0x${string}`,
        name: cp.wrapper.name,
        symbol: cp.wrapper.symbol,
        decimals: cp.wrapper.decimals,
      },
      rate: 0n,
      inferredTotalSupply: 0n,
      isValid: true,
      source: "custom" as const,
    }))

  return [...onchainPairs, ...custom]
}
