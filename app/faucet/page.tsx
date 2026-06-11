"use client"

import { useChainId } from "wagmi"
import { sepolia, mainnet } from "wagmi/chains"
import { useSwitchChain } from "wagmi"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FaucetCard } from "@/components/faucet/FaucetCard"
import { SEPOLIA_PAIRS } from "@/lib/contracts/addresses"
import { useReadContracts } from "wagmi"
import { ERC20ABI } from "@/lib/contracts/abis"
import { useMemo } from "react"

export default function FaucetPage() {
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const mockPairs = SEPOLIA_PAIRS.filter((p) => p.isMock)

  const metadataCalls = useMemo(
    () =>
      mockPairs.flatMap((p) => [
        { address: p.erc20, abi: ERC20ABI, functionName: "name" as const },
        { address: p.erc20, abi: ERC20ABI, functionName: "decimals" as const },
      ]),
    []
  )

  const { data: metadata } = useReadContracts({
    contracts: metadataCalls,
    query: { enabled: chainId === sepolia.id },
  })

  if (chainId !== sepolia.id) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Faucet</h1>
          <p className="text-muted-foreground mt-1">
            Claim Sepolia test tokens to try the wrap/unwrap flow.
          </p>
        </div>
        <Alert>
          <AlertDescription className="flex items-center justify-between flex-wrap gap-3">
            <span>The faucet is only available on Sepolia testnet.</span>
            <Button size="sm" onClick={() => switchChain({ chainId: sepolia.id })}>
              Switch to Sepolia
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Faucet</h1>
        <p className="text-muted-foreground mt-1">
          Claim 1,000 of each cTokenMock to try wrapping on Sepolia. Tokens are minted on demand — no daily limit.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockPairs.map((pair, i) => {
          const nameResult = metadata?.[i * 2]?.result
          const decimalsResult = metadata?.[i * 2 + 1]?.result
          return (
            <FaucetCard
              key={pair.erc20}
              symbol={pair.symbol}
              name={(nameResult as string) ?? pair.symbol}
              erc20Address={pair.erc20}
              wrapperAddress={pair.wrapper}
              decimals={(decimalsResult as number) ?? 18}
            />
          )
        })}
      </div>
    </div>
  )
}
