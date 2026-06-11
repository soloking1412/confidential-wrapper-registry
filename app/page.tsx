"use client"

import { useChainId } from "wagmi"
import { useRegistryPairs } from "@/hooks/useRegistryPairs"
import { RegistryTable } from "@/components/registry/RegistryTable"
import { TVSSummary } from "@/components/registry/TVSSummary"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RegistryPage() {
  const chainId = useChainId()
  const { pairs, isLoading, error, isSupported } = useRegistryPairs()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Wrapper Registry</h1>
        <p className="text-muted-foreground mt-1">
          Every official ERC-20 ↔ ERC-7984 confidential token pair sourced from the onchain registry.
        </p>
      </div>

      {!isSupported && (
        <Alert variant="destructive">
          <AlertDescription>
            The Wrappers Registry is not deployed on this network. Switch to Sepolia or Ethereum mainnet.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load registry: {error.message}</AlertDescription>
        </Alert>
      )}

      {isSupported && (
        <>
          <TVSSummary pairs={pairs} isLoading={isLoading} />
          <RegistryTable pairs={pairs} chainId={chainId} isLoading={isLoading} />
        </>
      )}
    </div>
  )
}
