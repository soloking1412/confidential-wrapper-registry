"use client"

import { http, createConfig } from "wagmi"
import { mainnet, sepolia } from "wagmi/chains"
import { getDefaultConfig } from "@rainbow-me/rainbowkit"

export const wagmiConfig = getDefaultConfig({
  appName: "Confidential Wrapper Registry",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "placeholder",
  chains: [sepolia, mainnet],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC),
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC),
  },
  ssr: true,
})
