"use client"

import { useState, useEffect, useCallback } from "react"
import type { PendingUnwrap } from "@/types"

const STORAGE_KEY = "zama_pending_unwraps"

function load(): PendingUnwrap[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
  } catch {
    return []
  }
}

function save(items: PendingUnwrap[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function usePendingUnwraps(walletAddress?: `0x${string}`, chainId?: number) {
  const [all, setAll] = useState<PendingUnwrap[]>([])

  useEffect(() => {
    setAll(load())
  }, [])

  const mine = all.filter(
    (u) =>
      (!walletAddress || u.walletAddress.toLowerCase() === walletAddress.toLowerCase()) &&
      (!chainId || u.chainId === chainId)
  )

  const add = useCallback((item: PendingUnwrap) => {
    setAll((prev) => {
      const next = [...prev.filter((u) => u.requestId !== item.requestId), item]
      save(next)
      return next
    })
  }, [])

  const update = useCallback((requestId: `0x${string}`, patch: Partial<PendingUnwrap>) => {
    setAll((prev) => {
      const next = prev.map((u) => (u.requestId === requestId ? { ...u, ...patch } : u))
      save(next)
      return next
    })
  }, [])

  const remove = useCallback((requestId: `0x${string}`) => {
    setAll((prev) => {
      const next = prev.filter((u) => u.requestId !== requestId)
      save(next)
      return next
    })
  }, [])

  return { mine, add, update, remove }
}
