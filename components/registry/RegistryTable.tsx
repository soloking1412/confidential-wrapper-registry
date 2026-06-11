"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { PairRow } from "./PairRow"
import type { WrapperPair } from "@/types"

interface Props {
  pairs: WrapperPair[]
  chainId: number
  isLoading: boolean
}

export function RegistryTable({ pairs, chainId, isLoading }: Props) {
  const [filter, setFilter] = useState("")

  const filtered = useMemo(() => {
    if (!filter) return pairs
    const q = filter.toLowerCase()
    return pairs.filter(
      (p) =>
        p.wrapper.symbol.toLowerCase().includes(q) ||
        p.erc20.symbol.toLowerCase().includes(q) ||
        p.wrapper.address.toLowerCase().includes(q) ||
        p.erc20.address.toLowerCase().includes(q)
    )
  }, [pairs, filter])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (!pairs.length) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">No wrapper pairs found on this network.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter by symbol or address…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Addresses</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>TVS</TableHead>
              <TableHead>Your Balance</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((pair) => (
              <PairRow key={pair.wrapper.address} pair={pair} chainId={chainId} />
            ))}
          </TableBody>
        </Table>
      </div>
      {filter && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {pairs.length} pairs
        </p>
      )}
    </div>
  )
}
