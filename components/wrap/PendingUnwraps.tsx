"use client"

import { useAccount, useChainId } from "wagmi"
import { usePendingUnwraps } from "@/hooks/usePendingUnwraps"
import { timeAgo } from "@/lib/format"
import { truncateAddress } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  onFinalize: (requestId: `0x${string}`, wrapperAddress: `0x${string}`) => void
}

export function PendingUnwraps({ onFinalize }: Props) {
  const { address } = useAccount()
  const chainId = useChainId()
  const { mine, remove } = usePendingUnwraps(address, chainId)

  const active = mine.filter((u) => u.status !== "done")
  if (!active.length) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Pending Unwraps
          <Badge variant="destructive">{active.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {active.map((u) => (
          <div
            key={u.requestId}
            className="flex items-center justify-between rounded-lg border p-3 text-sm"
          >
            <div className="space-y-0.5">
              <p className="font-mono text-xs text-muted-foreground">
                {truncateAddress(u.requestId)}
              </p>
              <p className="text-xs text-muted-foreground">
                {truncateAddress(u.wrapperAddress)} · {timeAgo(u.timestamp)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={u.status === "ready" ? "default" : "secondary"}
              >
                {u.status === "pending"
                  ? "Awaiting decryption"
                  : u.status === "ready"
                  ? "Ready to finalize"
                  : u.status === "finalizing"
                  ? "Finalizing…"
                  : u.status}
              </Badge>
              {u.status === "ready" && (
                <Button
                  size="sm"
                  onClick={() => onFinalize(u.requestId, u.wrapperAddress)}
                >
                  Finalize
                </Button>
              )}
              <button
                onClick={() => remove(u.requestId)}
                className="text-muted-foreground hover:text-destructive text-xs"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Unwrap finalization requires a relayer decryption round-trip (typically 5–30 min).
        </p>
      </CardContent>
    </Card>
  )
}
