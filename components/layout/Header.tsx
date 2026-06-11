"use client"

import Link from "next/link"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useChainId } from "wagmi"
import { sepolia } from "wagmi/chains"
import { NetworkSwitcher } from "./NetworkSwitcher"
import { usePendingUnwraps } from "@/hooks/usePendingUnwraps"
import { useAccount } from "wagmi"
import { Badge } from "@/components/ui/badge"

export function Header() {
  const chainId = useChainId()
  const { address } = useAccount()
  const { mine } = usePendingUnwraps(address, chainId)
  const pendingCount = mine.filter((u) => u.status === "pending" || u.status === "ready").length

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-primary">CWR</span>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Confidential Wrapper Registry
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Registry
            </Link>
            <Link href="/wrap" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              Wrap
              {pendingCount > 0 && (
                <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px]">
                  {pendingCount}
                </Badge>
              )}
            </Link>
            <Link href="/decrypt" className="text-muted-foreground hover:text-foreground transition-colors">
              Decrypt
            </Link>
            {chainId === sepolia.id && (
              <Link href="/faucet" className="text-muted-foreground hover:text-foreground transition-colors">
                Faucet
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <NetworkSwitcher />
          <ConnectButton accountStatus="avatar" chainStatus="none" showBalance={false} />
        </div>
      </div>
    </header>
  )
}
