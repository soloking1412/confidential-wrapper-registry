"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
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
import { useUnwrap } from "@/hooks/useUnwrap"
import { etherscanTx as ethTx } from "@/lib/contracts/addresses"
import type { WrapperPair } from "@/types"

const STATE_LABELS: Record<string, string> = {
  idle: "Unwrap",
  encrypting: "Encrypting…",
  requesting: "Submitting…",
  pending: "Submitted — awaiting relayer",
  finalizing: "Finalizing…",
  success: "Done",
  error: "Try again",
}

interface Props {
  pairs: WrapperPair[]
  chainId: number
}

export function UnwrapForm({ pairs, chainId }: Props) {
  const { address } = useAccount()
  const [selectedPair, setSelectedPair] = useState<WrapperPair | null>(pairs[0] ?? null)
  const [amount, setAmount] = useState("")

  const { state, error, requestId, finalizeTxHash, isLoading, initiateUnwrap, reset } =
    useUnwrap(selectedPair, amount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) {
      toast.error("Connect your wallet first")
      return
    }
    await initiateUnwrap()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Confidential Token</Label>
        <Select
          value={selectedPair?.wrapper.address ?? ""}
          onValueChange={(v) => {
            setSelectedPair(pairs.find((p) => p.wrapper.address === v) ?? null)
            setAmount("")
            reset()
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a token" />
          </SelectTrigger>
          <SelectContent>
            {pairs.map((p) => (
              <SelectItem key={p.wrapper.address} value={p.wrapper.address}>
                {p.wrapper.symbol} → {p.erc20.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Amount ({selectedPair?.wrapper.symbol ?? "—"})</Label>
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
        <p className="text-xs text-muted-foreground">
          Your encrypted balance is not shown until you decrypt it on the Decrypt page.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {state === "pending" && requestId && (
        <Alert>
          <AlertDescription className="space-y-1">
            <p>
              Unwrap requested.{" "}
              <span className="font-mono text-xs">{requestId.slice(0, 20)}…</span>
            </p>
            <p className="text-xs text-muted-foreground">
              The request will appear in Pending Unwraps above. Come back to finalize once the relayer completes decryption (5–30 min).
            </p>
          </AlertDescription>
        </Alert>
      )}

      {finalizeTxHash && (
        <p className="text-xs text-muted-foreground">
          Finalize tx:{" "}
          <a
            href={ethTx(chainId, finalizeTxHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {finalizeTxHash.slice(0, 10)}…
          </a>
        </p>
      )}

      <Button
        type="submit"
        disabled={
          !address ||
          isLoading ||
          !selectedPair ||
          !amount ||
          state === "pending" ||
          state === "success"
        }
        variant="outline"
        className="w-full"
      >
        {!address ? "Connect wallet" : STATE_LABELS[state] ?? "Unwrap"}
      </Button>
    </form>
  )
}
