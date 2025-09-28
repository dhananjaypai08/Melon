import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from "wagmi/chains";

const galelio = {
  id: 16661,
  name: "Galileo Testnet",
  nativeCurrency: { name: "Galileo", symbol: "OG", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://https://evmrpc-testnet.0g.ai"] },
  },
};

const mainnet_og = {
  id: 16602,
  name: "OG Mainnet",
  nativeCurrency: { name: "OG", symbol: "OG", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://evmrpc.0g.ai"] },
  },
};

export const config = getDefaultConfig({
  appName: "ETHGlobal",
  projectId: "2ef30f97cc3cd1fc5fbc037b40b98e43",
  chains: [mainnet_og, sepolia, galelio],
  ssr: true,
});
