"use client"

import Link from "next/link"
import { useChainId } from "wagmi"
import { mainnet, sepolia } from "wagmi/chains"
import { formatUnits } from "viem"
import { Shield, Database, Plus, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatCompactNumber } from "@/lib/format"
import { useCountUp } from "@/hooks/useCountUp"
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
      ? Math.round(pairs.reduce((acc, p) => acc + p.wrapper.decimals, 0) / pairs.length)
      : 6
  const networkLabel =
    chainId === mainnet.id ? "Mainnet" : chainId === sepolia.id ? "Sepolia" : "Unknown"
  const customCount = pairs.filter((p) => p.source === "custom").length
  const tvsNumber = totalTVS === 0n ? 0 : parseFloat(formatUnits(totalTVS, avgDecimals))

  const pairsDisplay = useCountUp(isLoading ? 0 : pairs.length)
  const tvsDisplay = useCountUp(isLoading ? 0 : tvsNumber)
  const customDisplay = useCountUp(isLoading ? 0 : customCount)

  const stats = [
    {
      label: "Registered Pairs",
      value: isLoading ? "—" : Math.round(pairsDisplay),
      sub: networkLabel,
      icon: Database,
      iconClass: "bg-primary/10 text-primary",
    },
    {
      label: "Total Value Shielded",
      value: isLoading ? "—" : formatCompactNumber(tvsDisplay),
      sub: "Aggregate inferred supply",
      icon: Shield,
      iconClass: "bg-violet-500/10 text-violet-400",
    },
    {
      label: "Custom Pairs",
      value: isLoading ? "—" : Math.round(customDisplay),
      sub: "Add a pair →",
      icon: Plus,
      iconClass: "bg-emerald-500/10 text-emerald-400",
      href: "/add-pair",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((s, i) => {
        const body = (
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-semibold tracking-tight truncate tabular-nums">{s.value}</p>
                <p className={`text-xs ${s.href ? "text-primary" : "text-muted-foreground"}`}>{s.sub}</p>
              </div>
              <div
                className={`rounded-lg p-2 shrink-0 transition-transform duration-300 ${
                  s.href ? "group-hover:scale-110 group-hover:rotate-90" : "hover:scale-110"
                } ${s.iconClass}`}
              >
                {s.href ? <ArrowRight className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
              </div>
            </div>
          </CardContent>
        )

        const cardClass = `border-border/60 animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 ${
          s.href ? "group cursor-pointer transition-colors hover:border-primary/40" : ""
        }`

        return s.href ? (
          <Link key={s.label} href={s.href} className="block">
            <Card className={cardClass} style={{ animationDelay: `${i * 80}ms` }}>
              {body}
            </Card>
          </Link>
        ) : (
          <Card key={s.label} className={cardClass} style={{ animationDelay: `${i * 80}ms` }}>
            {body}
          </Card>
        )
      })}
    </div>
  )
}
