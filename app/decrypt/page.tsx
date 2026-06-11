"use client"

import { useChainId } from "wagmi"
import { useRegistryPairs } from "@/hooks/useRegistryPairs"
import { DecryptPanel } from "@/components/decrypt/DecryptPanel"

export default function DecryptPage() {
  const chainId = useChainId()
  const { pairs, isLoading } = useRegistryPairs()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Decrypt Balances</h1>
        <p className="text-muted-foreground mt-1">
          View the decrypted balance of any ERC-7984 token via EIP-712 user decryption.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <DecryptPanel pairs={pairs} chainId={chainId} />
      )}
    </div>
  )
}
