import type { CustomPair } from "@/types"

/*
 * Add custom or dev-only ERC-20 ↔ ERC-7984 pairs here.
 * Onchain registry pairs always take precedence on conflict.
 * Custom pairs are tagged [custom] in the UI.
 *
 * Example entry:
 * {
 *   chainId: 11155111,
 *   erc20: {
 *     address: "0xYourERC20Address",
 *     name: "My Token",
 *     symbol: "MTK",
 *     decimals: 18,
 *   },
 *   wrapper: {
 *     address: "0xYourWrapperAddress",
 *     name: "Confidential My Token",
 *     symbol: "cMTK",
 *     decimals: 6,
 *   },
 * },
 */
export const CUSTOM_PAIRS: CustomPair[] = []
