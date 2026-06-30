"use client"

import { useState, useEffect, useCallback } from "react"
import type { ActivityItem } from "@/types"

const STORAGE_KEY = "zama_activity"
const MAX_ITEMS = 200

function load(): ActivityItem[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
  } catch {
    return []
  }
}

function persist(items: ActivityItem[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)))
  window.dispatchEvent(new Event("activity-changed"))
}

export function useActivity(walletAddress?: `0x${string}`, chainId?: number) {
  const [all, setAll] = useState<ActivityItem[]>([])

  useEffect(() => {
    const sync = () => setAll(load())
    sync()
    window.addEventListener("activity-changed", sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener("activity-changed", sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const mine = all
    .filter(
      (a) =>
        (!walletAddress || a.walletAddress.toLowerCase() === walletAddress.toLowerCase()) &&
        (!chainId || a.chainId === chainId)
    )
    .sort((a, b) => b.timestamp - a.timestamp)

  const add = useCallback((item: Omit<ActivityItem, "id" | "timestamp">) => {
    const entry: ActivityItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    }
    persist([entry, ...load()])
  }, [])

  const clear = useCallback(() => {
    const kept = load().filter(
      (a) =>
        !(
          (!walletAddress || a.walletAddress.toLowerCase() === walletAddress.toLowerCase()) &&
          (!chainId || a.chainId === chainId)
        )
    )
    persist(kept)
  }, [walletAddress, chainId])

  return { mine, add, clear }
}
