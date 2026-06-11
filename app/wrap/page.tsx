"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useChainId } from "wagmi"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRegistryPairs } from "@/hooks/useRegistryPairs"
import { WrapForm } from "@/components/wrap/WrapForm"
import { UnwrapForm } from "@/components/wrap/UnwrapForm"
import { PendingUnwraps } from "@/components/wrap/PendingUnwraps"
import { AddPairValidator } from "@/components/wrap/AddPairValidator"

function WrapPageInner() {
  const chainId = useChainId()
  const searchParams = useSearchParams()
  const defaultToken = searchParams.get("token") ?? undefined
  const { pairs, isLoading } = useRegistryPairs()

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Wrap / Unwrap</h1>
        <p className="text-muted-foreground mt-1">
          Convert ERC-20 tokens into confidential equivalents and back.
        </p>
      </div>

      <PendingUnwraps
        onFinalize={(requestId, wrapperAddress) => {
          console.log("Finalize:", requestId, wrapperAddress)
        }}
      />

      <Tabs defaultValue="wrap">
        <TabsList className="w-full">
          <TabsTrigger value="wrap" className="flex-1">
            Wrap (ERC-20 → cToken)
          </TabsTrigger>
          <TabsTrigger value="unwrap" className="flex-1">
            Unwrap (cToken → ERC-20)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wrap" className="pt-4">
          {isLoading ? (
            <div className="h-48 animate-pulse rounded-lg bg-muted" />
          ) : (
            <WrapForm pairs={pairs} chainId={chainId} defaultToken={defaultToken} />
          )}
        </TabsContent>

        <TabsContent value="unwrap" className="pt-4">
          {isLoading ? (
            <div className="h-48 animate-pulse rounded-lg bg-muted" />
          ) : (
            <UnwrapForm pairs={pairs} chainId={chainId} />
          )}
        </TabsContent>
      </Tabs>

      <AddPairValidator chainId={chainId} />
    </div>
  )
}

export default function WrapPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" />}>
      <WrapPageInner />
    </Suspense>
  )
}
