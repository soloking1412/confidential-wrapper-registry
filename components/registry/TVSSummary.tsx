"use client"

import { useChainId } from "wagmi"
import { sepolia, mainnet } from "wagmi/chains"
import { Card, CardContent } from "@/components/ui/card"
import { formatTVS } from "@/lib/format"
import type { WrapperPair } from "@/types"

interface Props {
  pairs: WrapperPair[]
  isLoading: boolean
}

export function TVSSummary({ pairs, isLoading }: Props) {
  const chainId = useChainId()

  const totalTVS = pairs.reduce((acc, p) => acc + p.inferredTotalSupply, 0n)
  const avgDecimals =
    pairs.length > 0
      ? pairs.reduce((acc, p) => acc + p.wrapper.decimals, 0) / pairs.length
      : 6

  const networkLabel = chainId === mainnet.id ? "Mainnet" : chainId === sepolia.id ? "Sepolia" : "Unknown"

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total Pairs</p>
          <p className="text-2xl font-semibold mt-1">
            {isLoading ? "—" : pairs.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{networkLabel}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total Value Shielded</p>
          <p className="text-2xl font-semibold mt-1">
            {isLoading ? "—" : formatTVS(totalTVS, Math.round(avgDecimals))}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Aggregate inferred supply</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Custom Pairs</p>
          <p className="text-2xl font-semibold mt-1">
            {isLoading ? "—" : pairs.filter((p) => p.source === "custom").length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Local config additions</p>
        </CardContent>
      </Card>
    </div>
  )
}
