export const PROOF_OF_CAPTURE_ADDRESS =
  "0x421789e6b291193bebe788f2122c500b943dfd58";
export const PROOF_OF_CAPTURE_ABI = [
  {
    inputs: [{ name: "deviceId", type: "string" }],
    name: "stakeTokens",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "STAKING_AMOUNT",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "isStaked",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: true, name: "timestamp", type: "uint256" },
    ],
    name: "Stake",
    type: "event",
  },
];

export const STAKING_AMOUNT = "10000000000000000"; // 0.01 ETH in wei
