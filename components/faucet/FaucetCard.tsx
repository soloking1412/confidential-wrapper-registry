"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseUnits } from "viem"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ERC20ABI } from "@/lib/contracts/abis"
import { etherscanTx as ethTx } from "@/lib/contracts/addresses"
import { timeAgo, truncateAddress } from "@/lib/format"

const FAUCET_KEY = "zama_faucet_claims"
const CLAIM_AMOUNT = "1000"
const CHAIN_ID = 11155111

interface FaucetEntry {
  walletAddress: string
  erc20Address: string
  timestamp: number
}

function loadClaims(): FaucetEntry[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(FAUCET_KEY) ?? "[]")
  } catch {
    return []
  }
}

function saveClaim(wallet: string, erc20: string) {
  if (typeof window === "undefined") return
  const existing = loadClaims().filter(
    (c) =>
      !(c.walletAddress.toLowerCase() === wallet.toLowerCase() &&
        c.erc20Address.toLowerCase() === erc20.toLowerCase())
  )
  localStorage.setItem(
    FAUCET_KEY,
    JSON.stringify([
      ...existing,
      { walletAddress: wallet, erc20Address: erc20, timestamp: Date.now() },
    ])
  )
}

interface Props {
  symbol: string
  name: string
  erc20Address: `0x${string}`
  wrapperAddress: `0x${string}`
  decimals: number
}

export function FaucetCard({ symbol, name, erc20Address, wrapperAddress, decimals }: Props) {
  const { address } = useAccount()
  const router = useRouter()
  const [lastClaim, setLastClaim] = useState<number | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [claimed, setClaimed] = useState(false)

  useEffect(() => {
    if (!address) return
    const claim = loadClaims().find(
      (c) =>
        c.walletAddress.toLowerCase() === address.toLowerCase() &&
        c.erc20Address.toLowerCase() === erc20Address.toLowerCase()
    )
    setLastClaim(claim?.timestamp ?? null)
  }, [address, erc20Address])

  const { writeContractAsync } = useWriteContract()
  const { isLoading: confirming } = useWaitForTransactionReceipt({ hash: txHash })

  const handleClaim = async () => {
    if (!address) {
      toast.error("Connect your wallet first")
      return
    }
    try {
      const hash = await writeContractAsync({
        address: erc20Address,
        abi: ERC20ABI,
        functionName: "mint",
        args: [address, parseUnits(CLAIM_AMOUNT, decimals)],
      })
      setTxHash(hash)
      saveClaim(address, erc20Address)
      setLastClaim(Date.now())
      setClaimed(true)
      toast.success(`Claimed ${CLAIM_AMOUNT} ${symbol}`, {
        action: {
          label: "View tx",
          onClick: () => window.open(ethTx(CHAIN_ID, hash), "_blank"),
        },
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Claim failed"
      toast.error(msg.includes("User rejected") ? "Transaction rejected" : "Claim failed")
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{symbol}</span>
          <span className="text-xs font-normal text-muted-foreground">{name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>
            ERC-20:{" "}
            <a
              href={`https://sepolia.etherscan.io/address/${erc20Address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono hover:underline text-blue-600 dark:text-blue-400"
            >
              {truncateAddress(erc20Address)}
            </a>
          </p>
          <p>
            Wrapper:{" "}
            <a
              href={`https://sepolia.etherscan.io/address/${wrapperAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono hover:underline text-blue-600 dark:text-blue-400"
            >
              {truncateAddress(wrapperAddress)}
            </a>
          </p>
        </div>

        {lastClaim && (
          <p className="text-xs text-muted-foreground">
            Last claimed {timeAgo(lastClaim)}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={handleClaim}
            disabled={confirming || !address}
          >
            {confirming ? "Claiming…" : `Claim ${CLAIM_AMOUNT} ${symbol}`}
          </Button>
          {claimed && (
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/wrap?token=${erc20Address}&chainId=${CHAIN_ID}`)
              }
            >
              Wrap →
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
