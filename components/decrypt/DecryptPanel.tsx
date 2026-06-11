"use client"

import { useState } from "react"
import { isAddress } from "viem"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useDecryptBalance } from "@/hooks/useDecryptBalance"
import { formatTokenAmount, truncateAddress } from "@/lib/format"
import type { WrapperPair } from "@/types"

interface Props {
  pairs: WrapperPair[]
  chainId: number
}

export function DecryptPanel({ pairs, chainId }: Props) {
  const { address } = useAccount()
  const { balances, loading, errors, decrypt } = useDecryptBalance()
  const [customAddr, setCustomAddr] = useState("")
  const [customDecimals, setCustomDecimals] = useState("6")

  const customAddress = isAddress(customAddr) ? (customAddr as `0x${string}`) : undefined
  const customKey = customAddr.toLowerCase()
  const customBalance = balances[customKey]
  const customLoading = loading[customKey]
  const customError = errors[customKey]

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Registry Tokens</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Decrypt your ERC-7984 balance for each registered wrapper. Requires an EIP-712 signature.
        </p>
      </div>

      {!address && (
        <Alert>
          <AlertDescription>Connect your wallet to decrypt balances.</AlertDescription>
        </Alert>
      )}

      {pairs.length > 0 ? (
        <div className="rounded-lg border divide-y">
          {pairs.map((pair) => {
            const key = pair.wrapper.address.toLowerCase()
            const balance = balances[key]
            const isLoading = loading[key]
            const err = errors[key]

            return (
              <div
                key={pair.wrapper.address}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="font-medium text-sm">{pair.wrapper.symbol}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {truncateAddress(pair.wrapper.address)}
                  </p>
                  <Badge variant="outline" className="mt-1 text-[10px]">
                    {pair.source}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  {balance !== undefined ? (
                    <span className="font-mono text-sm text-green-600 dark:text-green-400">
                      {formatTokenAmount(balance, pair.wrapper.decimals)}{" "}
                      <span className="text-xs text-muted-foreground">
                        {pair.wrapper.symbol}
                      </span>
                    </span>
                  ) : err ? (
                    <span className="text-xs text-destructive max-w-48">{err}</span>
                  ) : null}
                  <Button
                    size="sm"
                    variant={balance !== undefined ? "outline" : "default"}
                    onClick={() => decrypt(pair.wrapper.address, chainId)}
                    disabled={isLoading || !address}
                  >
                    {isLoading ? "Decrypting…" : balance !== undefined ? "Refresh" : "Decrypt"}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No pairs loaded yet.</p>
      )}

      <Separator />

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Arbitrary ERC-7984 Token</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Paste any ERC-7984 wrapper address to decrypt your balance — even tokens not in the registry.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Wrapper Address</Label>
            <Input
              placeholder="0x…"
              value={customAddr}
              onChange={(e) => setCustomAddr(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Wrapper Decimals</Label>
            <Input
              type="number"
              min="0"
              max="18"
              value={customDecimals}
              onChange={(e) => setCustomDecimals(e.target.value)}
            />
          </div>
        </div>
        {customError && (
          <Alert variant="destructive">
            <AlertDescription>{customError}</AlertDescription>
          </Alert>
        )}
        {customBalance !== undefined && (
          <p className="text-sm">
            Balance:{" "}
            <span className="font-mono font-medium text-green-600 dark:text-green-400">
              {formatTokenAmount(customBalance, parseInt(customDecimals) || 6)}
            </span>
          </p>
        )}
        <Button
          onClick={() => customAddress && decrypt(customAddress, chainId)}
          disabled={!customAddress || customLoading || !address}
          variant="outline"
        >
          {customLoading ? "Decrypting…" : "Decrypt Balance"}
        </Button>
      </div>
    </div>
  )
}
