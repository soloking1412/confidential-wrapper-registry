"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useDecryptBalance } from "@/hooks/useDecryptBalance"
import { truncateAddress, formatRate, formatTVS, formatTokenAmount } from "@/lib/format"
import { etherscanAddr } from "@/lib/contracts/addresses"
import type { WrapperPair } from "@/types"

interface Props {
  pair: WrapperPair
  chainId: number
}

function CopyAddr({ address, chainId }: { address: string; chainId: number }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <span className="flex items-center gap-1">
      <a
        href={etherscanAddr(chainId, address)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-xs text-blue-600 hover:underline dark:text-blue-400"
      >
        {truncateAddress(address)}
      </a>
      <button
        onClick={copy}
        className="text-muted-foreground hover:text-foreground text-xs"
        title="Copy address"
      >
        {copied ? "✓" : "⧉"}
      </button>
    </span>
  )
}

export function PairRow({ pair, chainId }: Props) {
  const router = useRouter()
  const { balances, loading, errors, decrypt } = useDecryptBalance()
  const [rateOpen, setRateOpen] = useState(false)

  const key = pair.wrapper.address.toLowerCase()
  const decryptedBalance = balances[key]
  const isDecrypting = loading[key]
  const decryptError = errors[key]

  const handleDecrypt = () => {
    decrypt(pair.wrapper.address, chainId)
  }

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{pair.wrapper.symbol}</span>
            <span className="text-xs text-muted-foreground">{pair.wrapper.name}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground w-14">ERC-20</span>
              <CopyAddr address={pair.erc20.address} chainId={chainId} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground w-14">Wrapper</span>
              <CopyAddr address={pair.wrapper.address} chainId={chainId} />
            </div>
          </div>
        </TableCell>
        <TableCell>
          <button
            onClick={() => setRateOpen(true)}
            className="text-sm hover:underline cursor-pointer"
            title="View rate details"
          >
            {formatRate(pair.rate)}
          </button>
        </TableCell>
        <TableCell className="font-mono text-sm">
          {formatTVS(pair.inferredTotalSupply, pair.wrapper.decimals)}{" "}
          <span className="text-muted-foreground text-xs">{pair.wrapper.symbol}</span>
        </TableCell>
        <TableCell>
          {decryptedBalance !== undefined ? (
            <span className="font-mono text-sm text-green-600 dark:text-green-400">
              {formatTokenAmount(decryptedBalance, pair.wrapper.decimals)}{" "}
              <span className="text-xs text-muted-foreground">{pair.wrapper.symbol}</span>
            </span>
          ) : decryptError ? (
            <span className="text-xs text-destructive">{decryptError}</span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDecrypt}
              disabled={isDecrypting}
            >
              {isDecrypting ? "Decrypting…" : "Decrypt"}
            </Button>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Badge variant={pair.source === "onchain" ? "default" : "secondary"}>
              {pair.source}
            </Badge>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() =>
                router.push(`/wrap?token=${pair.erc20.address}&chainId=${chainId}`)
              }
            >
              Wrap
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <Dialog open={rateOpen} onOpenChange={setRateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pair.wrapper.symbol} — Rate & Decimals</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Conversion rate</span>
                <span className="font-mono">{pair.rate.toString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ERC-20 decimals</span>
                <span className="font-mono">{pair.erc20.decimals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wrapper decimals</span>
                <span className="font-mono">{pair.wrapper.decimals}</span>
              </div>
            </div>
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="font-medium">Example</p>
              <p className="text-muted-foreground">
                Wrapping{" "}
                <code className="bg-background px-1 rounded">
                  {pair.rate.toString()} {pair.erc20.symbol}
                </code>{" "}
                yields{" "}
                <code className="bg-background px-1 rounded">
                  1 {pair.wrapper.symbol}
                </code>
              </p>
              <p className="text-muted-foreground text-xs">
                Amounts are truncated to the nearest rate multiple. Remainder is not wrapped.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
