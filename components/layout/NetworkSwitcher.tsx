"use client"

import { useChainId, useSwitchChain } from "wagmi"
import { mainnet, sepolia } from "wagmi/chains"
import { Button } from "@/components/ui/button"

export function NetworkSwitcher() {
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()

  const isSepolia = chainId === sepolia.id
  const isMainnet = chainId === mainnet.id

  if (!isSepolia && !isMainnet) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-destructive font-medium">Unsupported network</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => switchChain({ chainId: sepolia.id })}
          disabled={isPending}
        >
          Switch to Sepolia
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center rounded-full border bg-muted p-1 gap-1">
      <button
        onClick={() => chainId !== sepolia.id && switchChain({ chainId: sepolia.id })}
        disabled={isPending}
        className={`rounded-full px-3 py-1 text-sm font-medium transition-all ${
          isSepolia
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Sepolia
      </button>
      <button
        onClick={() => chainId !== mainnet.id && switchChain({ chainId: mainnet.id })}
        disabled={isPending}
        className={`rounded-full px-3 py-1 text-sm font-medium transition-all ${
          isMainnet
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Mainnet
      </button>
    </div>
  )
}
