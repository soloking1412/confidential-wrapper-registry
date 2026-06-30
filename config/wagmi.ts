"use client"

import { http, fallback } from "viem"
import { mainnet, sepolia } from "wagmi/chains"
import { getDefaultConfig } from "@rainbow-me/rainbowkit"

const SEPOLIA_RPCS = [
  process.env.NEXT_PUBLIC_SEPOLIA_RPC,
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://sepolia.gateway.tenderly.co",
  "https://1rpc.io/sepolia",
].filter(Boolean) as string[]

const MAINNET_RPCS = [
  process.env.NEXT_PUBLIC_MAINNET_RPC,
  "https://ethereum-rpc.publicnode.com",
  "https://eth.llamarpc.com",
  "https://cloudflare-eth.com",
].filter(Boolean) as string[]

export const wagmiConfig = getDefaultConfig({
  appName: "Confidential Wrapper Registry",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "placeholder",
  chains: [sepolia, mainnet],
  transports: {
    [sepolia.id]: fallback(SEPOLIA_RPCS.map((url) => http(url))),
    [mainnet.id]: fallback(MAINNET_RPCS.map((url) => http(url))),
  },
  ssr: true,
})
