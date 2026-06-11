export const REGISTRY_ADDRESSES: Record<number, `0x${string}`> = {
  1: "0xeb5015fF021DB115aCe010f23F55C2591059bBA0",
  11155111: "0x2f0750Bbb0A246059d80e94c454586a7F27a128e",
}

export const SEPOLIA_PAIRS: Array<{
  wrapper: `0x${string}`
  erc20: `0x${string}`
  symbol: string
  isMock: boolean
}> = [
  {
    wrapper: "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639",
    erc20: "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF",
    symbol: "cUSDCMock",
    isMock: true,
  },
  {
    wrapper: "0x4E7B06D78965594eB5EF5414c357ca21E1554491",
    erc20: "0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0",
    symbol: "cUSDTMock",
    isMock: true,
  },
  {
    wrapper: "0x46208622DA27d91db4f0393733C8BA082ed83158",
    erc20: "0xff54739b16576FA5402F211D0b938469Ab9A5f3F",
    symbol: "cWETHMock",
    isMock: true,
  },
  {
    wrapper: "0xaa5612FA27c927a0c7961f5AEFEE5ba3A0F9C891",
    erc20: "0xFf021fB13cA64e5354c62c954b949a88cfDEb25E",
    symbol: "cBRONMock",
    isMock: true,
  },
  {
    wrapper: "0xf2D628d2598aF4eAF94CB76a437Ff86CA78FfbFB",
    erc20: "0x75355a85c6FB9df5f0C80FF54e8747EEe9a0BF57",
    symbol: "cZAMAMock",
    isMock: true,
  },
  {
    wrapper: "0xfCE5c7069c5525eF6c8C2b2E35A745bA20a2F7CC",
    erc20: "0x93c931278A2aad1916783F952f94276eA5111442",
    symbol: "ctGBPMock",
    isMock: true,
  },
  {
    wrapper: "0xe4FcF848739845BC81Dee1d5352cf3844F0a60C7",
    erc20: "0x24377AE4AA0C45ecEe71225007f17c5D423dd940",
    symbol: "cXAUtMock",
    isMock: true,
  },
  {
    wrapper: "0x167DC962808B32CFFFc7e14B5018c0bE06A3A208",
    erc20: "0xf6Ef9ADB61A48E29E36bc873070A46A3D2667ff3",
    symbol: "ctGBP",
    isMock: false,
  },
]

export const MAINNET_PAIRS: Array<{
  wrapper: `0x${string}`
  erc20: `0x${string}`
  symbol: string
}> = [
  {
    wrapper: "0xe978F22157048E5DB8E5d07971376e86671672B2",
    erc20: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    symbol: "cUSDC",
  },
  {
    wrapper: "0xAe0207C757Aa2B4019Ad96edD0092ddc63EF0c50",
    erc20: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    symbol: "cUSDT",
  },
  {
    wrapper: "0xda9396b82634Ea99243cE51258B6A5Ae512D4893",
    erc20: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    symbol: "cWETH",
  },
  {
    wrapper: "0x85dE671c3bec1aDeD752c3Cea943521181C826bc",
    erc20: "0xBA2C598E11eD093079cC324FCa5BbbA99F616E83",
    symbol: "cBRON",
  },
  {
    wrapper: "0x80CB147Fd86dC6dEe3Eee7e4Cee33d1397d98071",
    erc20: "0xA12CC123ba206d4031D1c7f6223D1C2Ec249f4f3",
    symbol: "cZAMA",
  },
  {
    wrapper: "0xa873750ccBafD5ec7Dd13bfD5237d7129832eDD9",
    erc20: "0x27f6c8289550fce67f6b50bed1f519966afe5287",
    symbol: "ctGBP",
  },
  {
    wrapper: "0x73cc9aF9d6BEFdb3c3fAf8a5E8c05Cb95FdaEEf1",
    erc20: "0x68749665FF8D2d112Fa859AA293F07A622782F38",
    symbol: "cXAUt",
  },
]

export const ETHERSCAN_BASE: Record<number, string> = {
  1: "https://etherscan.io",
  11155111: "https://sepolia.etherscan.io",
}

export function etherscanTx(chainId: number, hash: string) {
  return `${ETHERSCAN_BASE[chainId] ?? "https://etherscan.io"}/tx/${hash}`
}

export function etherscanAddr(chainId: number, address: string) {
  return `${ETHERSCAN_BASE[chainId] ?? "https://etherscan.io"}/address/${address}`
}
