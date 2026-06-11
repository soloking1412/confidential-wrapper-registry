"use client"

import type { WalletClient, PublicClient } from "viem"

let sdkInstance: unknown = null
let sdkChainId: number | null = null

export async function getZamaSDK(
  walletClient: WalletClient,
  publicClient: PublicClient,
  chainId: number
) {
  if (sdkInstance && sdkChainId === chainId) {
    return sdkInstance
  }

  const { ZamaSDK, RelayerWeb, indexedDBStorage } = await import("@zama-fhe/sdk")
  const { ViemSigner } = await import("@zama-fhe/sdk/viem")

  const sdk = new ZamaSDK({
    relayer: new RelayerWeb({
      getChainId: async () => chainId,
      transports: {
        1: {
          relayerUrl: "/api/relayer/1",
          network: process.env.NEXT_PUBLIC_MAINNET_RPC ?? "",
        },
        11155111: {
          relayerUrl: "/api/relayer/11155111",
          network: process.env.NEXT_PUBLIC_SEPOLIA_RPC ?? "",
        },
      },
    }),
    signer: new ViemSigner({ walletClient, publicClient }),
    storage: indexedDBStorage,
  })

  sdkInstance = sdk
  sdkChainId = chainId
  return sdk
}

export function resetSDK() {
  sdkInstance = null
  sdkChainId = null
}
