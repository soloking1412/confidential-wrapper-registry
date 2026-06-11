"use client"

import { useState } from "react"
import { isAddress } from "viem"
import { useReadContract } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WrappersRegistryABI, ERC7984WrapperABI, ERC20ABI } from "@/lib/contracts/abis"
import { REGISTRY_ADDRESSES } from "@/lib/contracts/addresses"

interface Props {
  chainId: number
}

export function AddPairValidator({ chainId }: Props) {
  const [erc20Input, setErc20Input] = useState("")
  const [wrapperInput, setWrapperInput] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const erc20Addr = isAddress(erc20Input) ? (erc20Input as `0x${string}`) : undefined
  const wrapperAddr = isAddress(wrapperInput) ? (wrapperInput as `0x${string}`) : undefined
  const registryAddress = REGISTRY_ADDRESSES[chainId]

  const { data: registryCheck } = useReadContract({
    address: registryAddress,
    abi: WrappersRegistryABI,
    functionName: "getConfidentialTokenAddress",
    args: erc20Addr ? [erc20Addr] : undefined,
    query: { enabled: submitted && !!erc20Addr && !!registryAddress },
  })

  const { data: wrapperRate } = useReadContract({
    address: wrapperAddr,
    abi: ERC7984WrapperABI,
    functionName: "rate",
    query: { enabled: submitted && !!wrapperAddr },
  })

  const { data: wrapperDecimals } = useReadContract({
    address: wrapperAddr,
    abi: ERC7984WrapperABI,
    functionName: "decimals",
    query: { enabled: submitted && !!wrapperAddr },
  })

  const { data: erc20Symbol } = useReadContract({
    address: erc20Addr,
    abi: ERC20ABI,
    functionName: "symbol",
    query: { enabled: submitted && !!erc20Addr },
  })

  const { data: wrapperSymbol } = useReadContract({
    address: wrapperAddr,
    abi: ERC20ABI,
    functionName: "symbol",
    query: { enabled: submitted && !!wrapperAddr },
  })

  const isRegistered = submitted && registryCheck?.[0] === true
  const isValidWrapper = submitted && wrapperRate !== undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Validate a New Pair</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Check if an ERC-20 + wrapper address pair is valid before adding it to{" "}
          <code className="bg-muted px-1 rounded text-xs">config/customPairs.ts</code>.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>ERC-20 Address</Label>
            <Input
              placeholder="0x…"
              value={erc20Input}
              onChange={(e) => {
                setErc20Input(e.target.value)
                setSubmitted(false)
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Wrapper Address</Label>
            <Input
              placeholder="0x…"
              value={wrapperInput}
              onChange={(e) => {
                setWrapperInput(e.target.value)
                setSubmitted(false)
              }}
            />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSubmitted(true)}
          disabled={!erc20Addr || !wrapperAddr}
        >
          Validate
        </Button>

        {submitted && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant={isRegistered ? "default" : "secondary"}>
                {isRegistered ? "In registry" : "Not in registry"}
              </Badge>
              {isRegistered && (
                <span className="text-xs text-muted-foreground">
                  Registry maps this ERC-20 to{" "}
                  {(registryCheck as [boolean, string])?.[1]?.slice(0, 10)}…
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isValidWrapper ? "default" : "destructive"}>
                {isValidWrapper ? "Valid ERC-7984 wrapper" : "Could not read wrapper"}
              </Badge>
              {isValidWrapper && (
                <span className="text-xs text-muted-foreground">
                  rate={wrapperRate?.toString()}, decimals={wrapperDecimals}
                </span>
              )}
            </div>
            {!isRegistered && isValidWrapper && (
              <div className="rounded-lg bg-muted p-3 text-xs space-y-1">
                <p className="font-medium">Add to config/customPairs.ts:</p>
                <pre className="overflow-x-auto">
                  {`{
  chainId: ${chainId},
  erc20: { address: "${erc20Input}", name: "…", symbol: "${erc20Symbol ?? "?"}", decimals: 18 },
  wrapper: { address: "${wrapperInput}", name: "…", symbol: "${wrapperSymbol ?? "?"}", decimals: ${wrapperDecimals ?? 6} },
}`}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
