"use client"

import { useState, useEffect, useCallback } from "react"
import type { StoredCustomPair, WrapperPair } from "@/types"

const STORAGE_KEY = "zama_custom_pairs"

function load(): StoredCustomPair[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
  } catch {
    return []
  }
}

function save(items: StoredCustomPair[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event("custom-pairs-changed"))
}

function toWrapperPair(p: StoredCustomPair): WrapperPair {
  return {
    chainId: p.chainId,
    erc20: p.erc20,
    wrapper: p.wrapper,
    rate: (() => {
      try {
        return BigInt(p.rate)
      } catch {
        return 0n
      }
    })(),
    inferredTotalSupply: 0n,
    isValid: true,
    source: "custom",
  }
}

export function useCustomPairs(chainId?: number) {
  const [all, setAll] = useState<StoredCustomPair[]>([])

  useEffect(() => {
    const sync = () => setAll(load())
    sync()
    window.addEventListener("custom-pairs-changed", sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener("custom-pairs-changed", sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const stored = chainId ? all.filter((p) => p.chainId === chainId) : all
  const pairs = stored.map(toWrapperPair)

  const add = useCallback((pair: StoredCustomPair) => {
    const next = [
      ...load().filter(
        (p) =>
          !(p.chainId === pair.chainId &&
            p.wrapper.address.toLowerCase() === pair.wrapper.address.toLowerCase())
      ),
      pair,
    ]
    save(next)
  }, [])

  const remove = useCallback((wrapperAddress: string, removeChainId: number) => {
    const next = load().filter(
      (p) =>
        !(p.chainId === removeChainId &&
          p.wrapper.address.toLowerCase() === wrapperAddress.toLowerCase())
    )
    save(next)
  }, [])

  return { stored, pairs, add, remove }
}
