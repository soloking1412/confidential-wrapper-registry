"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { formatUnits } from "viem"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useWrap } from "@/hooks/useWrap"
import { formatTokenAmount } from "@/lib/format"
import { etherscanTx as ethTx } from "@/lib/contracts/addresses"
import type { WrapperPair } from "@/types"

interface Props {
  pairs: WrapperPair[]
  chainId: number
  defaultToken?: string
}

export function WrapForm({ pairs, chainId, defaultToken }: Props) {
  const { address } = useAccount()

  const defaultPair =
    pairs.find(
      (p) =>
        p.erc20.address.toLowerCase() === defaultToken?.toLowerCase()
    ) ?? pairs[0] ?? null

  const [selectedPair, setSelectedPair] = useState<WrapperPair | null>(defaultPair)
  const [amount, setAmount] = useState("")

  const { state, error, approveTxHash, wrapTxHash, erc20Balance, needsApproval, outputAmount, isLoading, execute, reset } =
    useWrap(selectedPair, amount)

  const setMax = () => {
    if (erc20Balance && selectedPair) {
      setAmount(formatUnits(erc20Balance, selectedPair.erc20.decimals))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) {
      toast.error("Connect your wallet first")
      return
    }
    await execute()
    if (state === "success" || wrapTxHash) {
      toast.success("Wrapped successfully", {
        action: wrapTxHash
          ? {
              label: "View tx",
              onClick: () => window.open(ethTx(chainId, wrapTxHash), "_blank"),
            }
          : undefined,
      })
      setAmount("")
      reset()
    }
  }

  const steps = [
    { label: "Approve", done: state === "approved" || state === "wrapping" || state === "success" },
    { label: "Wrap", done: state === "success" },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Token</Label>
        <Select
          value={selectedPair?.erc20.address ?? ""}
          onValueChange={(v) => {
            setSelectedPair(pairs.find((p) => p.erc20.address === v) ?? null)
            setAmount("")
            reset()
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a token" />
          </SelectTrigger>
          <SelectContent>
            {pairs.map((p) => (
              <SelectItem key={p.erc20.address} value={p.erc20.address}>
                {p.erc20.symbol} → {p.wrapper.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Amount ({selectedPair?.erc20.symbol ?? "—"})</Label>
          {erc20Balance !== undefined && selectedPair && (
            <button
              type="button"
              onClick={setMax}
              className="text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              Max: {formatTokenAmount(erc20Balance, selectedPair.erc20.decimals)}
            </button>
          )}
        </div>
        <Input
          type="number"
          min="0"
          step="any"
          placeholder="0.0"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
            if (state !== "idle") reset()
          }}
        />
        {selectedPair && amount && outputAmount !== undefined && (
          <p className="text-sm text-muted-foreground">
            You receive ≈{" "}
            <span className="font-medium">
              {formatTokenAmount(outputAmount, selectedPair.wrapper.decimals)}{" "}
              {selectedPair.wrapper.symbol}
            </span>
            {outputAmount === 0n && (
              <span className="text-destructive ml-2">
                Amount too small — must be at least {selectedPair.rate.toString()}{" "}
                {selectedPair.erc20.symbol}
              </span>
            )}
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {(state === "approving" || state === "approved" || state === "wrapping" || state === "success") && (
        <div className="flex gap-4">
          {steps.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-sm">
              <span
                className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${
                  s.done
                    ? "bg-green-500 text-white"
                    : "border bg-muted text-muted-foreground"
                }`}
              >
                {s.done ? "✓" : ""}
              </span>
              {s.label}
            </div>
          ))}
        </div>
      )}

      {approveTxHash && (
        <p className="text-xs text-muted-foreground">
          Approve tx:{" "}
          <a
            href={ethTx(chainId, approveTxHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {approveTxHash.slice(0, 10)}…
          </a>
        </p>
      )}

      <Button
        type="submit"
        disabled={!address || isLoading || !selectedPair || !amount || state === "success"}
        className="w-full"
      >
        {!address
          ? "Connect wallet"
          : isLoading
          ? state === "approving"
            ? "Approving…"
            : "Wrapping…"
          : needsApproval
          ? `Approve & Wrap`
          : "Wrap"}
      </Button>
    </form>
  )
}
